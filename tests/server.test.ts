import { server } from 'backend/server'
import QueryBuilder from 'common/query-builder'
import { CatQuery, CatRow, Item, TagQuery, TagRow } from 'common/types'
import { DateTime } from 'luxon'
import supertest from 'supertest'
import { DBTest } from 'tests/_classes'
import WebSocket from 'ws'

const req = supertest(server)


describe('SELECT', () => {

    test('basic select', async () => {

        // thi is NOT the MAIN database
        // the  main database serving the backend is IN the db file
        var testdb = new DBTest({ filename: './db-test-main.sqlite', debug: false })

        var catInput: CatQuery = {
            rec: await testdb.all<CatRow>('select * from category where id in (3)'),
            term: await testdb.all<CatRow>('select * from category where id in (46, 448)')
        }

        var tagInput: TagQuery = [
            await testdb.all<TagRow>('select * from tag where id IN (11, 14)'),
            await testdb.all<TagRow>('select * from tag where id=7'),
        ]

        var query = new QueryBuilder().tags(tagInput).categories(catInput).toJSON()

        const res = await req.post('/select')
            .send(query)
            .set('Accept', 'application/json')

        expect(res.headers["content-type"]).toMatch(/json/)
        expect(res.status).toEqual(200)
        expect(res.body).toHaveLength(3)
        expect(res.body[0].category).toHaveLength(4)
        expect(res.body[0].category[3].name).toBe("superdeepOFTG")

    }, 30000)
})




describe.only('INSERT', () => {

    test('basic insert', async () => {

        var inputCats: CatRow[] = [
            // { id: 2, pid: 1, name: 'Cat1' }, { id: 4, pid: 2, name: 'Cat3' },
            { id: null, pid: null, name: 'Cat10' }, { id: null, pid: null, name: 'Cat13' }
        ]

        var inputTags: TagRow[] = [
            // { id: 3, name: 'tag3' }, { id: 4, name: 'tag4' },
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

        var ws = new WebSocket('ws://localhost:3002/')
        void ws.on('open', () => console.log('OPENED!'))
        void ws.on('message', (data) => console.log('received: %s', data))


        const res = await req.put('/insert')
            .send(inputItem)
            .set('Accept', 'application/json')

        expect(res.status).toEqual(200)
        expect(res.body.email).toEqual('foo@bar.com')

    }, 30000)

})
