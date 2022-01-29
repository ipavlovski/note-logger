import { DBTest } from 'tests/_classes'
import QueryBuilder from 'common/query-builder'
import { CatRow, CatQuery, Item, TagQuery, TagRow, ItemRow } from 'common/types'
import { differenceBy } from 'lodash'
import { DateTime } from 'luxon'
import { DB } from 'backend/db'

describe('db test', () => {
    test('select / queryItems', async () => {
        const testdb = new DBTest({ filename: './db-test-main.sqlite' })

        var catInput: CatQuery = {
            rec: await testdb.all<CatRow>('select * from category where id in (3)'),
            term: await testdb.all<CatRow>('select * from category where id in (46, 448)')
        }

        var tagInput: TagQuery = [
            await testdb.all<TagRow>('select * from tag where id IN (11, 14)'),
            await testdb.all<TagRow>('select * from tag where id=7'),
        ]

        var query = new QueryBuilder().tags(tagInput).categories(catInput).toJSON()
        var results = await testdb.queryItems(query, 'preview')
        expect(results.length).toBe(3)
    })

    test('getCatChain', async () => {

        // create an in-memory database with empty tables
        const memorydb = await new DBTest({ debug: false }).init()

        // insert some test data into the database
        var Q = `INSERT INTO category (pid, name) VALUES 
        (null, 'Cat0'), (1, 'Cat1'), (1, 'Cat2'), 
        (2, 'Cat3'), (2, 'Cat4'), (3, 'Cat5'), (6, 'Cat6') 
        RETURNING *`
        await memorydb.all<CatRow[]>(Q)

        // first 2 elements already exist, last 2 do not exist
        var inputRows = [
            { id: 2, pid: 1, name: 'Cat1' }, { id: 4, pid: 2, name: 'Cat3' },
            { id: null, pid: null, name: 'Cat10' }, { id: null, pid: null, name: 'Cat13' }
        ]

        var outputRows = await memorydb.getCatChain(inputRows)
        var newRows = differenceBy(outputRows, inputRows, 'id')
        expect(newRows.map(({ id }) => id)).toStrictEqual([8, 9])
    })

    test('getTagList', async () => {

        var memorydb = await new DBTest({ debug: false }).init()
        var Q = `INSERT INTO  tag (name) VALUES ('tag1'), ('tag2'), ('tag3'), ('tag4') RETURNING *`
        await memorydb.all<TagRow[]>(Q)

        var inputTags = [
            { id: 3, name: 'tag3' }, { id: 4, name: 'tag4' },
            { id: null, name: 'tag10' }, { id: null, name: 'tag11' },
        ]

        var outputTags = await memorydb.getTagList(inputTags)
        var newTags = differenceBy(outputTags, inputTags, 'id')
        expect(newTags.map(({ id }) => id)).toStrictEqual([5, 6])

    })

    test('insertItem', async () => {

        const memorydb = await new DBTest({ debug: true }).init()

        var Q = `INSERT INTO category (pid, name) VALUES 
        (null, 'Cat0'), (1, 'Cat1'), (1, 'Cat2'), 
        (2, 'Cat3'), (2, 'Cat4'), (3, 'Cat5'), (6, 'Cat6') 
        RETURNING *`
        await memorydb.all<CatRow[]>(Q)

        var Q = `INSERT INTO  tag (name) VALUES ('tag1'), ('tag2'), ('tag3'), ('tag4') RETURNING *`
        await memorydb.all<TagRow[]>(Q)


        var inputCats = [
            { id: 2, pid: 1, name: 'Cat1' }, { id: 4, pid: 2, name: 'Cat3' },
            { id: null, pid: null, name: 'Cat10' }, { id: null, pid: null, name: 'Cat13' }
        ]

        var inputTags = [
            { id: 3, name: 'tag3' }, { id: 4, name: 'tag4' },
            { id: null, name: 'tag10' }, { id: null, name: 'tag11' },
        ]

        var inputItem: Omit<Item, 'id'> = {
            header: 'header-123',
            body: { md: '', html: '' },
            created: DateTime.now(),
            updated: null,
            archived: false,
            category: inputCats,
            tags: inputTags
        }

        var castable = await memorydb.insertItem(inputItem)

        expect(castable.insert).toHaveLength(5)
    }, 1e6)
})



describe('update one', () => {
    let db: DB

    beforeEach(async () => {
        db = new DB(':memory:', false)
        await db.init()
        await db.populate('./db-test-main.sqlite')
    })

    test('updateOne - no tags or cats', async () => {

        var id = 123
        const originalState = await db.get<ItemRow>('select * from item where id = 123')
        expect(originalState.header).toBe('Bash-123')
        expect(originalState.created).toBe(1640894025)
        expect(originalState.archived).toBe(0)

        var item: Omit<Partial<Item>, 'id'> = {
            header: 'header-123',
            body: { md: '', html: '' },
            created: DateTime.now(),
            updated: null,
            archived: false,
            category: null,
            tags: null
        }

        const output = await db.updateOne(id, item)
        const newState = output.update[0].value as Item
        expect(newState.header).toBe('header-123')
    })

    test('updateOne - cats only', async () => {
        var inputCats: CatRow[] = [
            { id: null, pid: null, name: 'Cat-Parent' },
            { id: null, pid: null, name: 'Cat-Child' }
        ]

        var id = 123

        var item: Omit<Partial<Item>, 'id'> = {
            header: 'header-123',
            body: { md: '', html: '' },
            created: DateTime.now(),
            updated: null,
            archived: false,
            category: inputCats,
            tags: null
        }

        const output = await db.updateOne(id, item)

        var expectedInsert = [ 
            { id: 301, pid: null, name: "Cat-Parent" }, { id: 302, pid: 301, name: "Cat-Child" } 
        ]

        // expect(output.insert[0]).toEqual(expectedInsert[0])
        expect((output.update[0].value as Item).category).toMatchObject(expectedInsert)
        expect((output.update[0].value as Item).header).toEqual('header-123')

    })

    test('updateOne - tags only', async () => {
        var inputTags = [{ id: null, name: 'tag-new' }, { id: 5, name: 'tag4' }]

        var id = 123

        var item: Omit<Partial<Item>, 'id'> = {
            header: 'header-123',
            body: { md: '', html: '' },
            created: DateTime.now(),
            updated: null,
            archived: false,
            category: null,
            tags: inputTags
        }

        const output = await db.updateOne(id, item)
        const expectedTag = [ { id: 21, name: "tag-new", }, { id: 5, name: "tag4", }, ]
        expect((output.update[0].value as Item).tags).toMatchObject(expectedTag)
        expect(output.insert[0]).toMatchObject({ type: "tag", value: { id: 21, name: "tag-new", }, })
        
    })

    test('updateOne - full', async () => {
        var inputTags: TagRow[] = [{ id: null, name: 'tag-new' }, { id: 5, name: 'tag4' }]
        var inputCats: CatRow[] = [
            { id: null, pid: null, name: 'Cat-Parent' },
            { id: null, pid: null, name: 'Cat-Child' }
        ]

        var id = 123

        var item: Omit<Partial<Item>, 'id'> = {
            header: 'header-123',
            body: { md: '', html: '' },
            created: DateTime.now(),
            updated: null,
            archived: false,
            category: inputCats,
            tags: inputTags
        }

        const output = await db.updateOne(id, item)
        expect(output.insert.map(v => v.type)).toMatchObject(['cat', 'cat', 'tag'])
    })
})



describe('update many', () => {
    let db: DB

    beforeEach(async () => {
        db = new DB(':memory:', false)
        await db.init()
        await db.populate('./db-test-main.sqlite')
    })

    test('test with id range', async () => {

        const ids = [123, 125, 250]
        const output = await db.updateMany(id, item)
    })

    test('test with a query', async () => {
        const tags: TagRow[][]
        const cats: CatQuery
        const query = new QueryBuilder().tags().categories()

        const output = await db.updateMany(id, item)
    })

})