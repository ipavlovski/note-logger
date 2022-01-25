import QueryBuilder from 'common/query-builder'
import { CatQuery, Query, TagRow } from 'common/types'

test('null query', () => {
    const builder = new QueryBuilder()

    const result: Query = {
        filter: {
            categories: null,
            tags: null,
            date: { created: null, updated: null },
            archived: null
        },
        search: { header: null, body: null },
        pager: { page: null, size: null }
    }

    expect(builder.toJSON()).toMatchObject(result)
})

test('created', () => {
    const builder = new QueryBuilder()
    builder.created('2015-03-21', '2015-03-22')

    const created = { filter: { date: { created: [1426924800, 1427011199] } } }

    expect(builder.toJSON()).toMatchObject(created)

})

test('updated', () => {
    const builder = new QueryBuilder()
    builder.updated('2015-03-24', '2015-03-28')

    const updated = { filter: { date: { updated: [1427184000, 1427270399] } } }

    expect(builder.toJSON()).toMatchObject(updated)

})

test('search', () => {
    const builder = new QueryBuilder()

    builder.search('header1')
    const headerOutput: Pick<Query, "search"> = { search: { header: 'header1', body: null } }
    expect(builder.toJSON()).toMatchObject(headerOutput)

    builder.search('header2', 'body1')
    const headerBodyOutput: Pick<Query, "search"> = { search: { header: 'header2', body: 'body1' } }
    expect(builder.toJSON()).toMatchObject(headerBodyOutput)
})

test('archived', () => {
    const builder = new QueryBuilder()
    builder.archived(false)

    const result = { filter: { archived: false } }

    expect(builder.toJSON()).toMatchObject(result)
})

test('pager', () => {
    const builder = new QueryBuilder()
    builder.pager(10, 300)
    const pagerOutput: Pick<Query, "pager"> = { pager: { size: 300, page: 10 } }

    expect(builder.toJSON()).toMatchObject(pagerOutput)
})


test('categories', () => {
    const builder = new QueryBuilder()
    const categories: CatQuery = {
        rec: [{ id: 3, pid: null, name: 'c' }, { id: 4, pid: null, name: 'd' }],
        term: [{ id: 1, pid: null, name: 'a' }, { id: 2, pid: null, name: 'b' }]
    }
    builder.categories(categories)

    const result = { term: [1, 2], rec: [3, 4] }

    expect(builder.toJSON().filter.categories).toStrictEqual(result)
})


test('tags', () => {
    const builder = new QueryBuilder()
    const tags: TagRow[][] = [
        [{ id: 1, name: 'a' }, { id: 3, name: 'b' }],
        [{ id: 5, name: 'c' }, { id: 7, name: 'd' }]
    ]
    builder.tags(tags)

    const result = [[1, 3], [5, 7]]

    expect(builder.toJSON().filter.tags).toStrictEqual(result)
})


test('full', () => {
    const builder = new QueryBuilder()
    const tags: TagRow[][] = [
        [{ id: 1, name: 'a' }, { id: 3, name: 'b' }],
        [{ id: 5, name: 'c' }, { id: 7, name: 'd' }]
    ]
    const categories: CatQuery = {
        rec: [{ id: 3, pid: null, name: 'c' }, { id: 4, pid: null, name: 'd' }],
        term: [{ id: 1, pid: null, name: 'a' }, { id: 2, pid: null, name: 'b' }]
    }

    builder.pager(10, 300)
        .archived(false)
        .search('header2', 'body1')
        .tags(tags)
        .categories(categories)
        .created('2015-03-21', '2015-03-22')
        .updated('2015-03-24', '2015-03-28')

    const result = {
        filter: {
            categories: {
                term: [1, 2],
                rec: [3, 4]
            },
            tags: [[1, 3], [5, 7]],
            date: {
                created: [1426924800, 1427011199],
                updated: [1427184000, 1427270399]
            },
            archived: false
        },
        search: { header: 'header2', body: 'body1' },
        pager: { size: 300, page: 10 }
    }

    expect(builder.toJSON()).toMatchObject(result)
})
