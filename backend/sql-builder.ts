import { Query, SqlParams } from 'common/types'

export class SqlBuilder {

    getTable(table: string): string {
        const category = `CREATE TABLE category (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            pid INTEGER, 
            name TEXT, 
            UNIQUE(pid, name),
            FOREIGN KEY (pid) REFERENCES category (id)
        )`

        const tag = `CREATE TABLE tag (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            name TEXT
        )`

        const item = `CREATE TABLE item (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            header TEXT,
            md TEXT,
            html TEXT,
            created INTEGER, 
            updated INTEGER,
            archived INTEGER,
            category_id INTEGER,
            FOREIGN KEY (category_id) REFERENCES category (id)
        )`

        const itemTag = `CREATE TABLE item_tag (
            tag_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            UNIQUE(tag_id, item_id),
            FOREIGN KEY (tag_id) REFERENCES tag (id),
            FOREIGN KEY (item_id) REFERENCES item (id)  
        )`

        switch (table) {
            case 'item': return item
            case 'category': return category
            case 'tag': return tag
            case 'item_tag': return itemTag
            default: throw new Error('No such table')
        }
    }


    protected parseMainParams(query: Query): SqlParams {

        const q = []
        const args = []

        // ALWAYS CREATE THE ARCHIVED QUERY
        // if archived is false or null/undefined, set archived to 0
        // 0 == show not archived only
        // otherwise show both (0 and 1)

        if (query.filter.archived != null) {
            q.push('archived = ?')
            args.push(query.filter.archived ? 1 : 0)
        }


        if (query.search.header != null) {
            q.push('header LIKE ?')
            args.push(`%${query.search.header}%`)
        }

        if (query.search.body != null) {
            q.push('md LIKE ?')
            args.push(`%${query.search.body}%`)
        }

        if (query.filter.date.created != null) {
            q.push('created BETWEEN ? AND ?')
            args.push(query.filter.date.created)
        }

        if (query.filter.date.updated != null) {
            q.push('updated BETWEEN ? AND ?')
            args.push(query.filter.date.updated)
        }

        return {
            q: q.join(' AND '),
            args: args.flat()
        }
    }

    protected parsePager(query: Query): SqlParams {
        // LIMIT <count> OFFSET <skip>
        const orderBy = 'ORDER BY item.created DESC'
        const limit = query.pager.size ? `LIMIT ?` : ''
        const page = query.pager.page ? `OFFSET ?` : ''
        // TODO: add to the array in the end

        return {
            q: '',
            args: []
        }
    }

    // INNER GROUPS REPRESENT 'AND'
    // OUTER GROUPS REPRESENT 'OR'
    protected parseTags(tagIds: number[][]): SqlParams {
        var mainArr = tagIds.map(arr => {
            const qmarks = arr.map(_ => '?')
            return {
                q: `COUNT(tag.id IN (${qmarks.join(', ')}) OR NULL) = ?`,
                args: arr.concat(arr.length)
            }
        })
        const Q = mainArr.map(v => v.q).join(' OR ')
        const args = mainArr.map(v => v.args)
        return {
            q: `GROUP BY item.id HAVING ${Q}`,
            args: args.flat()
        }
    }


    protected parseCategories({ rec, term }: { rec: number[], term: number[] }): SqlParams {

        const recQmarks = rec.map(_ => '?').join(',')
        const termQmarks = term.map(_ => '?').join(',')

        let q = ''

        if (term.length > 0 && rec.length == 0) {
            q = `INNER JOIN category ON item.category_id = category.id 
            WHERE category_id IN (${termQmarks})`
        }
        if (term.length == 0 && rec.length > 0) {
            q = `INNER JOIN (WITH RECURSIVE cat_table (cat_id, cat_pid, cat_name) AS (
                SELECT category.* FROM category WHERE id IN (${recQmarks})
                UNION ALL
                SELECT category.* FROM category
                JOIN cat_table ON category.pid = cat_table.cat_id
            ) SELECT * FROM cat_table) as output ON item.category_id = output.cat_id
            WHERE TRUE`
        }
        if (term.length > 0 && rec.length > 0) {
            q = `INNER JOIN (WITH RECURSIVE cat_table (cat_id, cat_pid, cat_name) AS (
                SELECT category.* FROM category WHERE id IN (${recQmarks})
                UNION ALL
                SELECT category.* FROM category
                JOIN cat_table ON category.pid = cat_table.cat_id
            ) SELECT * FROM cat_table UNION
            SELECT category.* FROM category 
            WHERE id IN (${termQmarks})) as output
            ON item.category_id = output.cat_id
            WHERE TRUE`
        }

        return {
            q: q,
            args: [rec, term].flat()
        }
    }

    tagsByItem(itemIds: number[]): SqlParams {
        return {
            q: `SELECT item.id as item_id, tag.id as id, tag.name as name from item
            INNER JOIN item_tag ON item.id = item_tag.item_id 
            INNER JOIN tag ON tag.id = item_tag.tag_id
            WHERE item.id IN (${itemIds.map(_ => '?').join(',')})`,
            args: itemIds
        }
    }

    select(query: Query, type: 'full' | 'preview'): SqlParams {
        // proper columns to query
        const previewCols = ['item.id', 'item.header', 'item.created',
            'item.updated', 'item.archived', 'item.category_id']
        const cols = (type == 'preview') ?
            previewCols : previewCols.concat(['item.md', 'item.html'])

        // check if the query has cats or tags
        const hasCats = query.filter.categories != null &&
            (query.filter.categories.rec.length > 0 || query.filter.categories.term.length > 0)
        const hasTags = query.filter.tags != null && query.filter.tags.length > 0

        // core args
        const catArgs = hasCats ? this.parseCategories(query.filter.categories) : null
        const tagArgs = hasTags ? this.parseTags(query.filter.tags) : null
        const mainArgs = this.parseMainParams(query)
        const pagerArgs = this.parsePager(query)

        // core statement
        const select = `SELECT ${cols.join(', ')} from item`
        const tagJoin = hasTags ? `INNER JOIN item_tag ON item.id = item_tag.item_id 
            INNER JOIN tag ON tag.id = item_tag.tag_id` : ''
        const catJoin = hasCats ? catArgs.q : ''
        const where = !mainArgs.q ? '' : hasCats ? 'AND' : 'WHERE'
        const tagHaving = hasTags ? tagArgs.q : ''


        // final output
        const q = `${select} ${tagJoin} ${catJoin} ${where} ${mainArgs.q} ${tagHaving} ${pagerArgs.q}`
        const args = [
            hasCats ? catArgs.args : [],
            mainArgs.args,
            hasTags ? tagArgs.args : [],
            pagerArgs.args
        ].flat()
        return { q, args }

    }
}

const sqlBuilder = new SqlBuilder()
export default sqlBuilder
