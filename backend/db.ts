import sqlite3 from 'sqlite3'
import { existsSync } from 'fs'
import { CategoryRow, RunResult, Item, Query, TagRow, ItemRow, SqlParams, Castable } from 'common/types'
import { DateTime, DurationLike } from 'luxon'
import { flattenDeep, dropRight, last, differenceBy } from 'lodash'
import sqlBuilder from 'backend/sql-builder'


export default class DB {
    db: sqlite3.Database

    constructor(filename: string, debug: boolean) {
        this.db = new sqlite3.Database(filename)
        this.db.run("PRAGMA foreign_keys = ON")
        if (debug) this.db.on('trace', (event) => console.log('TRACE:', event))
    }

    async init() {
        for (const table of ['category', 'tag', 'item', 'item_tag']) {
            await this.run(sqlBuilder.getTable(table))
        }
        return this
    }


    // insert/update/delete
    // return changes/lastId
    protected async run(q: string, args?: any[]): Promise<RunResult> {
        return new Promise((resolve, reject) => {
            this.db.run(q, args ?? [], function (err) {
                err ? reject(err) : resolve({ changes: this.changes, lastID: this.lastID })
            })
        })
    }

    // select multiple rows
    protected async all<T>(q: string, args?: any[]): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            this.db.all(q, args ?? [], (err, rows) => err ? reject(err) : resolve(rows))
        })
    }

    // select single row
    protected async get<T>(q: string, args?: any[]): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.db.get(q, args ?? [], (err, row) => err ? reject(err) : resolve(row))
        })
    }



    async reconsructCategoryChain(catId: number) {

        const acc: CategoryRow[] = []
        let out = await this.categoryById(catId)
        if (!out) throw new Error(`No category with id=${catId}`)
        do {
            acc.push(out)
            if (out.pid == null) break
            out = await this.categoryById(out.pid)
            if (!out) throw new Error(`No category with id=${out.pid}`)
        } while (true)

        return acc.reverse()
    }


    protected async getItemTags(itemId: number): Promise<string[]> {
        const q = `select name from tag inner join item_tag on tag.id = item_tag.tag_id where item_tag.item_id = ?`
        return await this.all<{ name: string }>(q, [itemId]).then(rows => rows.map(v => v.name))
    }










    protected async setItemTags(itemId: number, tags: TagRow[]) {
        const tagItemSelect = 'select * from item_tag where tag_id = ? and item_id = ?'
        const tagItemInsert = 'insert into item_tag (tag_id, item_id) values (?, ?)'
        for (const tag of tags) {
            const results = await this.get(tagItemSelect, [tag.id, itemId])
            if (!results) await this.run(tagItemInsert, [tag.id, itemId])
        }
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
        return await this.get<CategoryRow>("select * from category where id = ?", [id])
    }

    // pid+name unique constraint -> return an ID for exsiting pid+name combination
    // pid must exist -> if no element with id == pid, then will throw an error
    // return the RunResult of created item on success
    // throw error on failure
    protected async categoryInsert(pid: number, name: string) {

        // if pid=null, then category is considered to be top level
        // if an item already exists,
        // return the item's id in form of RunResult with changes set to 0
        const selectQ = pid ?
            "select * from category where pid = ? and name = ?" :
            "select * from category where pid IS NULL and name = ?"
        const args = pid ? [pid, name] : [name]
        const match = await this.get<CategoryRow>(selectQ, args)
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
        return await this.get<CategoryRow>(insertQ, [pid, name])
    }


    protected async getCatChain(chain: CategoryRow[]): Promise<CategoryRow[]> {
        let last: CategoryRow
        const acc: CategoryRow[] = []
        for (let ind = 0; ind < chain.length; ind++) {
            const curr = chain[ind]
            last = (curr.id != null) ? curr : (ind == 0) ?
                await this.categoryInsert(null, curr.name) :
                await this.categoryInsert(last.id, curr.name)
            acc.push(last)
        }
        return acc
    }


    // create new item
    // based on the items properties, generate an 'insert' statement
    // this is where the date are converted to integers
    // and default values are specified
    async insertItem(item: Partial<Item>): Promise<Castable> {

        const output: Castable = { insert: [] }

        // first, check that all the necessary properties are here
        if (!(item.header && item.created)) {
            throw new Error(`meta.header and date.created fields are required.`)
        }

        // the 2 mandatory fields
        const created = item.created.toSeconds() | 0
        const header = item.header

        // the 2 body fields - allowed to be blank, but not null/undefined
        const md = item.body?.md ?? ''
        const html = item.body?.html ?? ''

        // updated field CAN be set (e.g. when creating back-dated items)
        const updated = item.updated ? item.updated.toSeconds() | 0 : null

        // archived must be false on item creation, regardless of input
        const archived = 0

        // get the category id using category chain
        const inputCats = (item.category?.length > 0) ? item.category : null
        const outputCats = inputCats ? await this.getCatChain(inputCats) : null
        const catId = outputCats ? outputCats[outputCats.length - 1].id : null
        const catDiff = differenceBy(outputCats, inputCats, 'id')
        catDiff.forEach(catRow => output.insert.push({ type: 'cat', value: catRow }))

        // insert tags
        const inputTags = (item.tags?.length > 0) ? item.tags : null
        const outputTags = inputTags ? await this.getTagList(inputTags) : null
        const tagDiff = differenceBy(outputTags, inputTags, 'id')
        tagDiff.forEach(tagRow => output.insert.push({ type: 'tag', value: tagRow }))

        // insert item into db
        const q = `insert into item (header, md, html, created, updated, archived, category_id)
        VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`
        const args = [header, md, html, created, updated, archived, catId]
        const itemRow = await this.get<ItemRow>(q, args)
        const outputItem: Item = {
            id: itemRow.id,
            header: header,
            body: { md, html },
            created: item.created,
            updated: item.updated ? item.updated : null,
            archived: false,
            category: outputCats,
            tags: outputTags
        }
        output.insert.push({ type: 'item', value: outputItem})

        // setup the mappings
        await this.setItemTags(itemRow.id, outputTags)

        return output
    }




    private getCatChainForItem(id: number, allCats: CategoryRow[]) {
        let row = allCats.find(v => v.id == id)
        if (!row) return null
        var acc: CategoryRow[] = [row]
        while (row != null && row.pid != null) {
            row = allCats.find(v => v.id == row.pid)
            acc.push(row)
        }
        return acc.reverse()
    }

    private getTagsForItem(itemId: number, itemTags: Array<{ item_id: number } & TagRow>): TagRow[] {
        const matchedTags = itemTags.filter(itemTag => itemTag.item_id == itemId)
        return matchedTags.map(({ id, name }) => ({ id, name }))
    }

    async queryItems(query: Query, type: 'full' | 'preview'): Promise<Item[]> {

        // query#1 - items
        const itemQuery: SqlParams = sqlBuilder.select(query, type)
        var itemRows = await this.all<ItemRow>(itemQuery.q, itemQuery.args)
        var ids = itemRows.map(({ id }) => id)

        // query#2 - categories
        var allCatRows = await this.all<CategoryRow>(`select * from category`)

        // query#3 - tags
        var tagQuery = sqlBuilder.tagsByItem(ids)
        var itemTags = await this.all<{ item_id: number } & TagRow>(tagQuery.q, tagQuery.args)

        // now, putting it all together
        return itemRows.map(row => {
            return {
                id: row.id,
                header: row.header,
                body: type == 'full' ? { md: row.html, html: row.html } : { md: '', html: '' },
                created: DateTime.fromSeconds(row.created),
                updated: row.updated ? DateTime.fromSeconds(row.updated) : null,
                archived: row.archived ? true : false,
                category: this.getCatChainForItem(row.id, allCatRows),
                tags: this.getTagsForItem(row.id, itemTags)
            }
        })
    }






    async deleteItem(id: number): Promise<RunResult> {
        return null
    }


}

