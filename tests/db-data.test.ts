import { dbExecute, dbQuery, reloadSQL } from '../src/db'

beforeAll(async (done) => {
    await reloadSQL('src/schema.sql')
    await reloadSQL('src/data.sql')

    done()
})

test('TABLE: category', async done => {
    const query = `select * from category`
    const args = []
    const results = await dbQuery(query, args)


    expect(results.length).toEqual(3)
    expect(results[1].name).toEqual('hardcover')
    done()
})

test('TABLE: book', async done => {
    const query = `select * from book`
    const args = []
    const results = await dbQuery(query, args)

    expect(results.length).toEqual(3)
    expect(results[1].category_id).toEqual(2)
    done()
})

test('TABLE: tag', async done => {
    const query = `select * from tag`
    const args = []
    const results = await dbQuery(query, args)


    expect(results.length).toEqual(4)
    expect(results.find(({id}) => id == 3).name).toEqual('drama')
    done()
})


test('TABLE: book_tag', async done => {
    const query = `select book.name, tag.name from book_tag
    inner join book on book.id = book_tag.book_id
    inner join tag on tag.id = book_tag.tag_id;`
    const args = []
    const results = await dbQuery(query, args)


    expect(results.length).toEqual(3)
    expect(results.filter(row => row.name == 'kids').length).toEqual(2)
    done()
})
