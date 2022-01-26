import DB from 'backend/db'
import { SqlBuilder } from 'backend/sql-builder'
import { unlinkSync, existsSync } from 'fs'
import { CategoryRow, Item, ItemRow, Query, TagRow } from 'common/types'

export class DBTest extends DB {

    constructor({ filename = ':memory:', rebuild = false, debug = true }) {
        if (rebuild && filename != ':memory:' && existsSync(filename)) unlinkSync(filename)
        super(filename, debug)
    }

    // query runners
    async run(q: string, args?: any[]) { return await super.run(q, args ?? []) }
    async all<T>(q: string, args?: any[]) { return await super.all<T>(q, args ?? []) }
    async get<T>(q: string, args?: any[]) { return await super.get<T>(q, args ?? []) }

    // categories
    async categoryById(id: number) { return await super.categoryById(id) }
    async categoryInsert(pid: number, name: string) { return await super.categoryInsert(pid, name) }
    async reconsructCategoryChain(catId: number) { return await super.reconsructCategoryChain(catId) }

    // tags
    async getOrCreateTag(name: string) { return await super.getOrCreateTag(name) }
    async getItemTags(itemId: number) { return await super.getItemTags(itemId) }
    async setItemTags(itemId: number, tags: TagRow[]) { return await super.setItemTags(itemId, tags) }

    async getTagList(tags: TagRow[]) { return await super.getTagList(tags) }
    async getCatChain(chain: CategoryRow[]) { return await super.getCatChain(chain) }

    // items
    async insertItem(item: Partial<Item>) { return await super.insertItem(item) }
}

export class DBUtils extends DBTest {

    async listTables() {
        return await super.all<any>("select name from sqlite_master where type=?", ['table'])
    }
    async clearTables() {
        const tables = ['item_tag', 'tag', 'item', 'category']
        for await (const table of tables) await super.run(`delete from ${table}`, [])
    }
}


export class SqlBuilderTest extends SqlBuilder {
    // protected
    parseTags(tagIds: number[][]) { return super.parseTags(tagIds) }
    parseCategories(categories: { rec: number[], term: number[] }) { return super.parseCategories(categories) }
    parseMainParams(query: Query) { return super.parseMainParams(query) }

    // public
    select(query: Query, type: 'full' | 'preview') { return super.select(query, type) }
}
