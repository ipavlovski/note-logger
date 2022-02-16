import { TagQuery } from 'backend/validation'
import { CatQuery, Query, SqlParams } from 'common/types'
import { dateParser } from 'common/utils'

export default function parseQuery(query: Query): SqlParams {

    // main sql statement
    const stmt: string[] = []
    const stmtArgs: any[] = []

    // deermine the 'core' output columns
    // if type == preview, DONT incldue md and html columns
    // if type == full,    DO   include md and html columns
    const type = query.type
    const previewCols = ['item.id', 'item.header', 'item.created',
        'item.updated', 'item.archived', 'item.category_id']
    const cols = (type == 'preview') ?
        previewCols : previewCols.concat(['item.md', 'item.html'])
    stmt.push(`SELECT ${cols.join(', ')} from item`)

    // tag join, if tags are present
    const tagArgs = query.tags != null ? parseTags(query.tags) : null
    const tagJoin = `INNER JOIN item_tag ON item.id = item_tag.item_id 
    INNER JOIN tag ON tag.id = item_tag.tag_id`
    if (tagArgs) stmt.push(tagJoin)

    // add cat statement if cats are present
    if (query.cats) {
        const { q, args } = parseCategories(query.cats)
        stmt.push(q)
        stmtArgs.push(args)
    } else {
        stmt.push('WHERE TRUE')
    }

    if (query.archived != null) {
        stmt.push('AND archived = ?')
        stmtArgs.push(query.archived ? 1 : 0)
    }

    if (query.created != null) {
        const [start, end] = dateParser(query.created)
        stmt.push('AND created BETWEEN ? AND ?')
        stmtArgs.push(start, end)
    }

    if (typeof query.updated !== 'undefined') {
        if (query.updated == null) {
            stmt.push('AND updated = NULL')
        } else {
            const [start, end] = dateParser(query.updated)
            stmt.push('AND updated BETWEEN ? AND ?')
            stmtArgs.push(start, end)
        }
    }

    if (query.search != null) {
        const { q, args } = parseSearch(query.search)
        stmt.push(q)
        stmtArgs.push(args)
    }

    // tags - after all the clauses
    if (tagArgs) {
        stmt.push(tagArgs.q)
        stmtArgs.push(tagArgs.args)
    }

    // pager - at the end
    if (query.pager) {
        const { q, args } = parsePager(query.pager)
        stmt.push(q)
        stmtArgs.push(args)
    }

    return { q: stmt.join(' '), args: stmtArgs.flat() }
}


function parsePager({ size, page }: { size: number, page: number }): SqlParams {
    // LIMIT <count> OFFSET <skip>
    const orderBy = 'ORDER BY item.created DESC'
    size ? `LIMIT ?` : ''
    page ? `OFFSET ?` : ''
    // TODO: add to the array in the end

    return {
        q: '',
        args: []
    }
}

// INNER GROUPS REPRESENT 'AND'
// OUTER GROUPS REPRESENT 'OR'
function parseTags(tags: TagQuery): SqlParams {
    // filter out all tagged items
    if (!tags.map(v => v.length).some(v => v > 0)) {
        return {
            q: `AND item_tag.tag_id = NULL`,
            args: []
        }
    }

    const tagIds = tags.map(outer => outer.map(inner => inner.id))
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


function parseCategories({ rec, term }: CatQuery): SqlParams {
    let q = ''

    const recIds = rec.map(v => v.id)
    const termIds = term.map(v => v.id)
    const recQmarks = rec.map(_ => '?').join(',')
    const termQmarks = term.map(_ => '?').join(',')

    if (term.length == 0 && rec.length == 0) {
        q = `INNER JOIN category ON item.category_id = category.id 
        WHERE category_id = NULL`
    }

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

    return { q: q, args: [recIds, termIds].flat() }
}


function parseSearch({ header, body }: { header?: string | undefined, body?: string | undefined }): SqlParams {
    if (header == null && body == null) {
        return { q: '', args: [] }
    } else if (header != null && body != null) {
        return { q: 'AND (header LIKE ? OR md LIKE ?)', args: [`%${header}%`, `%${body}%`] }
    } else if (header != null) {
        return { q: 'AND header LIKE ?', args: [`%${header}%`] }
    } else {
        // (body != null)
        return { q: 'AND md LIKE ?', args: [`%${body}%`] }
    }
}

