import { Book, queryBooks, reloadSQL } from 'index'

beforeAll(async (done) => {
    await reloadSQL('src/schema.sql')
    await reloadSQL('src/data.sql')

    done()
})


test('Books', async done => {
    const books: Book[] = await queryBooks()

    expect(books.find(({id}) => id == 1).tags.length).toEqual(2)
    expect(books.find(({name}) => name == 'Kids Stories').category).toEqual('paperback')

    done()
}