import { DB, db } from 'backend/db'
import { server } from 'backend/server'
import QueryBuilder from 'common/query-builder'
import { CatQuery, CatRow, TagQuery, TagRow } from 'common/types'
import supertest from 'supertest'

const req = supertest(server)


describe('SELECT', () => {
    let testdb: DB

    beforeEach(async () => {
        testdb = new DB(':memory:', false)
        await testdb.init()
        await testdb.populate('./db-test-main.sqlite')
    })

    test('basic select', async () => {

        var catInput: CatQuery = {
            rec: await testdb.all<CatRow>('select * from category where id in (3)'),
            term: await testdb.all<CatRow>('select * from category where id in (46, 448)')
        }

        var tagInput: TagQuery = [
            await testdb.all<TagRow>('select * from tag where id IN (11, 14)'),
            await testdb.all<TagRow>('select * from tag where id=7'),
        ]

        var query = new QueryBuilder().tags(tagInput).categories(catInput).toJSON()

        await db.populate('./db-test-main.sqlite')

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


