import parseQuery from 'backend/query-parser'
import SQLite from 'backend/sqlite'
import { dbPath } from 'common/config'
import { Castable, CatRow, InsertItem, Item, ItemRow, Query, SqlParams, TagRow, UpdateManyArgs, UpdateOneArgs } from 'common/types'
import { differenceBy } from 'lodash'
import { DateTime } from 'luxon'


class DB extends SQLite {

    constructor(filename: string, debug = false) {
        super(filename, debug)
    }

    async init() {
        await this.createTables()
        return this
    }

    async populate(sourcePath: string) {
        await this.run(`ATTACH '${sourcePath}' AS db2;`)
        await this.run('INSERT INTO category SELECT * FROM db2.category')
        await this.run('INSERT INTO item SELECT * FROM db2.item')
        await this.run('INSERT INTO tag SELECT * FROM db2.tag')
        await this.run('INSERT INTO item_tag SELECT * FROM db2.item_tag')
        await this.run('DETACH db2')
    }

    async clear() {
        for (const table of ['item_tag', 'tag', 'item', 'category']) {
            await this.run(`drop table ${table}`)
        }
    }

    async createTables() {
        const category = `CREATE TABLE IF NOT EXISTS category (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            pid INTEGER, 
            name TEXT, 
            UNIQUE(pid, name),
            FOREIGN KEY (pid) REFERENCES category (id)
        )`

        const tag = `CREATE TABLE IF NOT EXISTS tag (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            UNIQUE(name)
        )`

        const item = `CREATE TABLE IF NOT EXISTS item (
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

        const itemTag = `CREATE TABLE IF NOT EXISTS item_tag (
            tag_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            UNIQUE(tag_id, item_id),
            FOREIGN KEY (tag_id) REFERENCES tag (id),
            FOREIGN KEY (item_id) REFERENCES item (id)  
        )`

        for (const table of [category, tag, item, itemTag]) {
            await this.run(table)
        }
    }





    protected async unsetAllItemTags(itemIds: number | number[]) {
        const ids = [itemIds].flat()
        await this.run(`DELETE FROM item_tag 
        WHERE item_id IN (${ids.map(_ => "?").join(', ')})`, ids)
    }

    protected async unsetSomeItemTags(itemIds: number | number[], tags: TagRow[]) {
        const ids = [itemIds].flat()
        const tagIds = tags.map(({ id }) => id)
        await this.all(`DELETE FROM item_tag as t1 WHERE EXISTS (SELECT * FROM 
            (SELECT tag.id as tag_id, item.id as item_id FROM item 
            CROSS JOIN tag 
            WHERE item.id IN (${ids.map(_ => "?").join(', ')})
            AND tag.id IN (${tagIds.map(_ => '?').join(', ')}) 
            ) as t2 WHERE t1.item_id = t2.item_id 
            AND t1.tag_id = t2.tag_id)`, [ids, tagIds].flat())
    }


    protected async setItemTags(itemIds: number | number[], tags: TagRow[]) {
        const ids = [itemIds].flat()
        const tagIds = tags.map(({ id }) => id)
        await this.run(`INSERT OR IGNORE INTO item_tag (item_id, tag_id)
            SELECT item.id as item_id, tag.id as tag_id FROM item 
            CROSS JOIN tag WHERE item.id IN (${ids.map(_ => "?").join(', ')}) 
            AND tag.id IN (${tagIds.map(_ => '?').join(', ')})`, [ids, tagIds].flat())
    }


    protected async getOrCreateTag(name: string): Promise<TagRow> {
        const match = await this.get<TagRow>('select * from tag where name = ?', [name])
        if (match) return match
        return await this.get<TagRow>("insert into tag (name) values (?) RETURNING *", [name])
    }


    protected async getTagList(tags: TagRow[]): Promise<TagRow[]> {
        const acc: TagRow[] = []
        for (const tag of tags) {
            const outputTag = (tag.id != null) ? tag : await this.getOrCreateTag(tag.name)
            acc.push(outputTag)
        }
        return acc
    }


    protected async categoryById(id: number) {
        return await this.get<CatRow>("select * from category where id = ?", [id])
    }

    // pid+name unique constraint -> return an ID for exsiting pid+name combination
    // pid must exist -> if no element with id == pid, then will throw an error
    // return the RunResult of created item on success
    // throw error on failure
    protected async categoryInsert(pid: number | null, name: string) {

        // if pid=null, then category is considered to be top level
        // if an item already exists,
        // return the item's id in form of RunResult with changes set to 0
        const selectQ = pid ?
            "select * from category where pid = ? and name = ?" :
            "select * from category where pid IS NULL and name = ?"
        const args = pid ? [pid, name] : [name]
        const match = await this.get<CatRow>(selectQ, args)
        if (match) return match

        // if an item doesn't exist, check if parent exists (if pid not null)
        // this is here IN PLACE of the foreign key
        // note: may need to 'review' this function alter
        if (pid) {
            const parent = await this.categoryById(pid)
            if (!parent) throw new Error(`No element with id=${pid} in the database`)
        }

        // if pid-item exists, ant no pid+name pair is present -> insert this new pairing
        const insertQ = "insert into category (pid, name) values (?, ?) RETURNING *"
        return await this.get<CatRow>(insertQ, [pid, name])
    }


    protected async getCatChain(chain: CatRow[]): Promise<CatRow[]> {
        let last: CatRow
        const acc: CatRow[] = []
        for (let ind = 0; ind < chain.length; ind++) {
            const curr = chain[ind]

            last = (curr.id != null) ? curr : (ind == 0) ?
                await this.categoryInsert(null, curr.name) :
                await this.categoryInsert(last!.id, curr.name)
            acc.push(last)
        }
        return acc
    }



    // should unpopulated categories/tags be nulls or empty arrays?
    // what to do about 'preview' vs. 'full' query mode?
    private inflateItemRow(itemRow: ItemRow, cats: CatRow[] | null, tags: TagRow[] | null) {
        const md = itemRow.md ?? ''
        const html = itemRow.html ?? ''
        const updated = itemRow.updated ? DateTime.fromSeconds(itemRow.updated).toJSDate() : null

        const outputItem: Item = {
            id: itemRow.id,
            header: itemRow.header,
            body: { md, html },
            created: DateTime.fromSeconds(itemRow.created).toJSDate(),
            updated: updated,
            archived: itemRow.archived ? true : false,
            category: cats != null ? cats : null,
            tags: tags != null ? tags : null
        }
        return outputItem
    }


    private getCatChainForItem(id: number, allCats: CatRow[]) {
        let row = allCats.find(v => v.id == id)
        if (!row) return null
        var acc: CatRow[] = [row]
        while (row != null && row.pid != null) {
            row = allCats.find(v => v.id == row?.pid)
            if (row == null) break
            acc.push(row)
        }
        return acc.reverse()
    }


    private tagsByItem(itemIds: number[]): SqlParams {
        return {
            q: `SELECT item.id as item_id, tag.id as id, tag.name as name from item
            INNER JOIN item_tag ON item.id = item_tag.item_id 
            INNER JOIN tag ON tag.id = item_tag.tag_id
            WHERE item.id IN (${itemIds.map(_ => '?').join(',')})`,
            args: itemIds
        }
    }

    private getTagsForItem(itemId: number, itemTags: Array<{ item_id: number } & TagRow>): TagRow[] {
        const matchedTags = itemTags.filter(itemTag => itemTag.item_id == itemId)
        return matchedTags.map(({ id, name }) => ({ id, name }))
    }

    private async getItemTagJoin(itemRows: ItemRow[]) {
        var ids = itemRows.map(({ id }) => id)
        var tagQuery = this.tagsByItem(ids)
        return await this.all<{ item_id: number } & TagRow>(tagQuery.q, tagQuery.args)
    }

    async queryItems(query: Query): Promise<Item[]> {

        // query#1 - items
        const itemQuery: SqlParams = parseQuery(query)
        var itemRows = await this.all<ItemRow>(itemQuery.q, itemQuery.args)

        // query#2 - categories
        var allCatRows = await this.all<CatRow>(`select * from category`)

        // query#3 - tags
        var itemTagJoin = await this.getItemTagJoin(itemRows)

        // now, putting it all together
        return itemRows.map(row => {
            const cats = this.getCatChainForItem(row.category_id, allCatRows)
            const tags = this.getTagsForItem(row.id, itemTagJoin)
            return this.inflateItemRow(row, cats, tags)
        })
    }


    // create new item
    // based on the items properties, generate an 'insert' statement
    // this is where the date are converted to integers
    // and default values are specified
    async insertItem(item: InsertItem): Promise<Castable> {

        const output: Castable = { insert: [] }

        // first, check that all the necessary properties are here
        if (!(item.header && item.created)) {
            throw new Error(`meta.header and date.created fields are required.`)
        }

        // the 2 mandatory fields
        const created = item.created.valueOf() / 1000 | 0
        const header = item.header

        // the 2 body fields - allowed to be blank, but not null/undefined
        const md = item.body?.md ?? ''
        const html = item.body?.html ?? ''

        // updated field CAN be set (e.g. when creating back-dated items)
        const updated = item.updated ? item.updated.valueOf() / 1000 | 0 : null

        // archived must be false on item creation, regardless of input
        const archived = 0

        // get the category id using category chain
        const inputCats =  item.category ?? null
        const outputCats = inputCats ? await this.getCatChain(inputCats) : null
        const catId = outputCats ? outputCats[outputCats.length - 1].id : null
        if (inputCats != null) {
            const catDiff = differenceBy(outputCats, inputCats, 'id')
            catDiff.forEach(catRow => output.insert!.push({ type: 'cat', value: catRow }))    
        }

        // insert tags
        const inputTags = item.tags ?? null
        const outputTags = inputTags ? await this.getTagList(inputTags) : null
        if (inputTags != null) {
            const tagDiff = differenceBy(outputTags, inputTags, 'id')
            tagDiff.forEach(tagRow => output.insert!.push({ type: 'tag', value: tagRow }))    
        }

        // insert item into db
        const q = `insert into item (header, md, html, created, updated, archived, category_id)
        VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`
        const args = [header, md, html, created, updated, archived, catId]
        const itemRow = await this.get<ItemRow>(q, args)
        const outputItem: Item = this.inflateItemRow(itemRow, outputCats, outputTags)

        output.insert!.push({ type: 'item', value: outputItem })

        // setup the mappings
        if (outputTags != null) await this.setItemTags(itemRow.id, outputTags)

        return output
    }



    private parseSetParams(item: Partial<Item>) {

        const q: string[] = []
        const args: any[] = []

        if (item.header) {
            q.push('header = ?')
            args.push(item.header)
        }

        if (item.body != null) {
            q.push('html = ?', 'md = ?')
            args.push(item.body.html, item.body.md)
        }

        if (item.created != null) {
            q.push('created = ?')
            args.push(item.created.valueOf() / 1000 | 0)
        }

        if (item.updated != null) {
            q.push('updated = ?')
            args.push(item.updated.valueOf() / 1000 | 0)
        }

        if (item.archived != null) {
            q.push('archived = ?')
            args.push(item.archived ? 1 : 0)
        }

        return { q, args }
    }


    async updateOne({ id, item }: UpdateOneArgs) {

        const output: Castable = { insert: [], update: [] }
        const sqlParams = this.parseSetParams(item)

        // CATEGORIES
        let cats: CatRow[]
        if (item.category != null) {
            if (item.category.length == 0) {
                sqlParams.q.push('category_id = ?')
                sqlParams.args.push(null)
            } else {
                cats = await this.getCatChain(item.category)
                const catDiff = differenceBy(cats, item.category, 'id')
                catDiff.forEach(catRow => output.insert!.push({ type: 'cat', value: catRow }))
                sqlParams.q.push('category_id = ?')
                sqlParams.args.push(cats[cats.length - 1].id)
            }
        }

        // TAGS
        let tags: TagRow[]
        if (item.tags != null) {
            if (item.tags.length == 0) {
                await this.unsetAllItemTags(id)
            } else {
                tags = await this.getTagList(item.tags)
                const tagDiff = differenceBy(tags, item.tags, 'id')
                tagDiff.forEach(tagRow => output.insert!.push({ type: 'tag', value: tagRow }))
                await this.unsetAllItemTags(id)
                await this.setItemTags(id, tags)
            }
        }

        // run the query
        sqlParams.args.push(id)
        const Q = `UPDATE item SET ${sqlParams.q.join(', ')} WHERE item.id = ? RETURNING *`
        const itemRow = await this.get<ItemRow>(Q, sqlParams.args)

        // generate item
        const outputItem = this.inflateItemRow(itemRow, cats!, tags!)
        output.update!.push({ type: 'item', value: outputItem })
        return output

    }

    // async updateMany(item: UpdateItemMany[], op: 'add' | 'remove' | 'replace') {
    async updateMany({ ids, item, op }: UpdateManyArgs) {

        const output: Castable = { insert: [], update: [] }
        const sqlParams = this.parseSetParams(item)

        // CATEGORIES
        let cats: CatRow[]
        if (item.category != null) {
            if (item.category.length == 0) {
                sqlParams.q.push('category_id = ?')
                sqlParams.args.push(null)
            } else {
                cats = await this.getCatChain(item.category)
                const catDiff = differenceBy(cats, item.category, 'id')
                catDiff.forEach(catRow => output.insert!.push({ type: 'cat', value: catRow }))
                sqlParams.q.push('category_id = ?')
                sqlParams.args.push(cats[cats.length - 1].id)
            }
        }

        // TAGS
        let tags: TagRow[]
        if (item.tags != null) {
            if (item.tags.length == 0) {
                await this.unsetAllItemTags(ids)
            } else {
                tags = await this.getTagList(item.tags)
                const tagDiff = differenceBy(tags, item.tags, 'id')
                tagDiff.forEach(tagRow => output.insert!.push({ type: 'tag', value: tagRow }))

                if (op == null) throw new Error('Tag operation must be provided!')
                switch (op) {
                    case 'add':
                        await this.setItemTags(ids, tags)
                        break
                    case 'remove':
                        await this.unsetSomeItemTags(ids, tags)
                        break
                    case 'replace':
                        await this.unsetAllItemTags(ids)
                        await this.setItemTags(ids, tags)
                        break
                }
            }
        }

        // run the query
        sqlParams.args.push(ids)
        const Q = `UPDATE item SET ${sqlParams.q.join(', ')} 
        WHERE item.id IN (${ids.map(_ => '?').join(', ')}) RETURNING *`
        const itemRows = await this.all<ItemRow>(Q, sqlParams.args.flat())

        // get item tag colelction for the rows
        var itemTagJoin = await this.getItemTagJoin(itemRows)

        // generate item
        // NEED TO GET TAGS!
        for (const row of itemRows) {
            const tags = this.getTagsForItem(row.id, itemTagJoin)
            const outputItem = this.inflateItemRow(row, cats!, tags)
            output.update!.push({ type: 'item', value: outputItem })
        }
        return output

    }

    async deleteItem(id: number) {
        const output: Castable = { delete: [] }
        await this.run('delete from item_tag where item_id = ?', [id])
        const itemRow = await this.get<ItemRow>('delete from item where id = ? RETURNING *', [id])
        if (itemRow != null) {
            const outputItem = this.inflateItemRow(itemRow, null, null)
            output.delete!.push({ type: 'item', value: outputItem })
        }
        return output
    }

    async renameTag(id: number, name: string) {
        const output: Castable = { rename: [] }
        const tagRow = await this.get<TagRow>('update tag set name = ? where id = ? returning *', [name, id])
        output.rename!.push({ type: 'tag', value: tagRow })
        return output
    }

    async renameCat(id: number, name: string) {
        const output: Castable = { rename: [] }
        const catRow = await this.get<CatRow>('update category set name = ? where id = ? returning *', [name, id])
        output.rename!.push({ type: 'cat', value: catRow })
        return output
    }

    async getMetadata(): Promise<{ cats: CatRow[]; tags: TagRow[] }>  {
        const cats = await this.all<CatRow>('select * from category')
        const tags = await this.all<TagRow>('select * from tag')
        return { cats, tags }
    }
}



const db = new DB(dbPath!, false)
db.init()

export { DB, db }
