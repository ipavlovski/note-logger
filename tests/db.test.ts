import { DBTest } from 'tests/_classes'
import QueryBuilder from 'common/query-builder'
import { CatRow, CatQuery, Item, TagQuery, TagRow } from 'common/types'
import { differenceBy } from 'lodash'
import { DateTime } from 'luxon'

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
