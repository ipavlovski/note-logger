import sqlite3 from 'sqlite3'
import { existsSync } from 'fs'
import { CategoryRow, RunResult, Item, Query, TagRow, ItemRow, SqlParams, Castable } from 'common/types'
import { DateTime, DurationLike } from 'luxon'
import { flattenDeep, dropRight, last } from 'lodash'
import sqlBuilder from 'backend/sql-builder'


export default class DB {
    db: sqlite3.Database

    constructor(filename: string, debug: boolean) {
        const dbExists = existsSync(filename)
        this.db = new sqlite3.Database(filename)
        this.db.run("PRAGMA foreign_keys = ON")
        if (debug) this.db.on('trace', (event) => console.log('TRACE:', event))
        if (!dbExists) this.createTables()
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


    protected async createTables() {
        for await (const table of ['category', 'tag', 'item', 'item_tag']) {
            await this.run(sqlBuilder.getTable(table))
        }
    }

    // on success, return CategoryRow of corresponding category
    // can assign this ID to the site
    async getOrCreateCategory(catChain: string[]): Promise<CategoryRow> {
        const acc: CategoryRow[] = []
        for (let ind = 0; ind < catChain.length; ind++) {
            const val = catChain[ind]
            // if its the firest element in category-chain, use null as pid
            // otherwise, use the previous element's id in acc as pid
            const pid = ind == 0 ? null : acc[ind - 1].id
            const id = await this.categoryInsert(pid, val)
            const out = await this.categoryById(id)
            if (!out) throw new Error("Failed to get/create category")
            acc.push(out)
        }
        return acc[acc.length - 1]
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


    protected async categoryById(id: number) {
        return await this.get<CategoryRow>("select * from category where id = ?", [id])
    }


    // in order for cateogry parser to work, categories need to be continuous
    // there should be no breaks between subcategories
    protected async parseCategoryQuery(categories: string[][]): Promise<number[]> {
        // separate inputs based on recursive and non-recursiev chains
        const recChains = categories.filter(arr => last(arr) != '$')
        const nonrecChains = categories.filter(arr => last(arr) == '$').map(arr => dropRight(arr))

        // prep ID repository for final output
        const idAcc: number[][] = []

        // prep non-recursvie rows
        const nonRecRows: CategoryRow[] = []
        for await (const chain of nonrecChains) nonRecRows.push(await this.getOrCreateCategory(chain))
        idAcc.push(nonRecRows.map(v => v.id))

        // prep the initial set of recursive rows
        const recRows: CategoryRow[] = []
        for await (const chain of recChains) recRows.push(await this.getOrCreateCategory(chain))
        let ids = recRows.map(v => v.id) // use these IDs in the iterative stage
        idAcc.push(ids)

        // iterate until all vals are exhausted
        const rows: CategoryRow[] = []
        do {
            // it is SAFE to insert the ids directly, since they come from verified input
            const query = `select * from category where pid IN (${ids.join(',')})`
            const rows = await this.all<CategoryRow>(query, [])
            ids = rows.map(v => v.id)
            idAcc.push(ids)
        } while (ids.length > 0)

        // flatten the output
        return flattenDeep(idAcc)
    }



    // can only update category names (basic rename)
    // does not affect id/pid inheritance structure
    // return null on success, throw an error on failure
    protected async categoryUpdate(id: number, newName: string) {
    }

    // when deleting, must delete not only the cateogry
    // BUT also the trailing category chain
    // cant delete category assigned to items - must unassign first
    // return null on success, throw an error on failure
    protected async categoryDelete() {

    }

    protected async getOrCreateTag(name: string) {
        const match = await this.get<TagRow>('select * from tag where name = ?', [name])
        if (match) return match.id

        return await this.run("insert into tag (name) values (?)", [name]).then(v => v.lastID)
    }


    protected async setItemTags(itemId: number, tags: string[]) {
        const tagItemSelect = 'select * from item_tag where tag_id = ? and item_id = ?'
        const tagItemInsert = 'insert into item_tag (tag_id, item_id) values (?, ?)'
        for await (const tag of tags) {
            const tagId = await this.getOrCreateTag(tag)
            const results = await this.get(tagItemSelect, [tagId, itemId])
            if (!results) await this.run(tagItemInsert, [tagId, itemId])
        }
    }

    protected async getItemTags(itemId: number): Promise<string[]> {
        const q = `select name from tag inner join item_tag on tag.id = item_tag.tag_id where item_tag.item_id = ?`
        return await this.all<{ name: string }>(q, [itemId]).then(rows => rows.map(v => v.name))
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
        // if id is null, need to create a new item, otherwise it is a real item with an id
        // if it is the first item of the arrary, use NULL as pid
        // otherwise use the latest pid

        let last: CategoryRow
        const acc: CategoryRow[] = []
        for (let ind = 0; ind < chain.length; ind++) {
            const curr = chain[ind] 
            last = (curr.id != null) ? curr : (ind == 0) ?
                await this.categoryInsert(null, curr.name) :
                await this.categoryInsert(last.id, curr.name)
            acc.push(curr)
        }
        return acc
    }


    // create new item
    // based on the items properties, generate an 'insert' statement
    // this is where the date are converted to integers
    // and default values are specified
    async insertItem(item: Partial<Item>): Promise<Castable> {

        // first, check that all the necessary properties are here
        if (!(item.header && item.created)) {
            throw new Error(`meta.header and date.created fields are required.`)
        }

        // the 2 mandatory fields
        const created = item.created.toSeconds() | 0
        const header = item.header

        // the 2 body fields - allowed to be blank, but not null/undefined
        const md = item.body.md ?? ''
        const html = item.body.html ?? ''

        // updated field CAN be set (e.g. when creating back-dated items)
        const updated = item.updated ? item.updated.toSeconds() | 0 : null

        // archived must be false on item creation, regardless of input
        const archived = 0

        // get the category id using category chain
        
        const catId = (item.category && item.category.length > 0) ?
            await this.getCatChain(item.category) : null

        // insert item into db
        const q = `insert into item (header, md, html, created, updated, archived, category_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)`
        const args = [header, md, html, created, updated, archived, catId]
        const itemId = await this.run(q, args).then(v => v.lastID)

        // insert tags
        const tagNames = item.tags.map(v => v.name)
        await this.setItemTags(itemId, tagNames)

        var output: Castable = {
            insert: []
        }

        // order matters!

        return {
            insert: []
        }
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

