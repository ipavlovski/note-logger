import { dbExecute, reloadSQL } from '../src/db'

beforeAll(async (done) => {
    await reloadSQL('src/schema.sql')
    done()
})

test('INSERT INTO book - minimal example', async done => {
    const query = `insert into book (name, author) values ?`
    const args = [ [ [ 'Harry Potter', 'JK Rowling' ], [ 'Davinci Code', 'Dan Brown' ] ] ]
    const results = await dbExecute(query, args)

    expect(results.affectedRows).toEqual(2)
    expect(results.insertId).toEqual(1)
    done()
})

test('INSERT INTO category - new', async done => {
    const query = `insert into category (name) values ?`
    const args = [[['paperback'], ['hardcover'], ['audiobook']]]
    const results = await dbExecute(query, args)
    
    expect(results.affectedRows).toEqual(3)
    expect(results.insertId).toEqual(1)
    done()
})

test('INSERT INTO tag - new', async done => {
    const query = `insert into tag (name) values ?`
    const args = [[['fiction'], ['thriller'], ['drama'], ['comedy']]]
    const results = await dbExecute(query, args)
    
    expect(results.affectedRows).toEqual(4)
    expect(results.insertId).toEqual(1)
    done()
})


test('INSERT INTO book - with a category', async done => {
    const query = `insert into book (name, author, category_id) values ?`
    const args = [ [ [ 'Harry Potter', 'JK Rowling', 2 ], [ 'Davinci Code', 'Dan Brown', 1 ] ] ]
    const results = await dbExecute(query, args)

    expect(results.affectedRows).toEqual(2)
    expect(results.insertId).toEqual(3)
    done()
})
