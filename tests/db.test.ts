import { DBTest } from 'tests/_classes'
import QueryBuilder from 'common/query-builder'
import { CategoryRow, CatQuery, TagQuery, TagRow } from 'common/types'

test('select / queryItems', async () => {
    const testdb = new DBTest({ filename: './db-test-main.sqlite' })

    var catInput: CatQuery = {
        rec: await testdb.all<CategoryRow>('select * from category where id in (3)'),
        term: await testdb.all<CategoryRow>('select * from category where id in (46, 448)')
    }

    var tagInput: TagQuery = [
        await testdb.all<TagRow>('select * from tag where id IN (11, 14)'),
        await testdb.all<TagRow>('select * from tag where id=7'),
    ]

    var query = new QueryBuilder().tags(tagInput).categories(catInput).toJSON()
    var results = await testdb.queryItems(query, 'preview')
    expect(results.length).toBe(3)
})