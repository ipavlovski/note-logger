import {  DB } from 'backend/db'
// import { serverPort } from 'common/config'
import { Item, Query } from 'common/types'
import { vanillaReviver } from 'common/utils'
import fetch from 'node-fetch'

const serverPort = 3002


let db: DB
beforeEach(async () => {
    db = new DB(':memory:', false)
    await db.init()
    await db.populate('./db-test-main.sqlite')
})


describe.only('db test', () => {

    test('select / queryItems', async () => {

        var query: Query = {
            type: "full",
            cats: {
                term: [],
                rec: [ { id: 1, pid: null, name: "catV", }, ],
            },
        }
        
        var results = await db.queryItems(query)
        expect(results.length).toBe(3)
    })
})




describe('HTTP-SELECT', () => {

    test('basic select', async () => {
        const testdb = new DB(':memory:', false)
        await testdb.init()
        await testdb.populate('./db-test-main.sqlite')


        var query: Query = {
            type: "full",
            cats: {
                term: [],
                rec: [ { id: 1, pid: null, name: "catV", }, ],
            },
        }

        const res = await fetch(`http://localhost:${serverPort}/select`, {
            method: 'POST',
            body: JSON.stringify(query),
            headers: { 'Content-Type': 'application/json' }
        })
        var body: Item[] = await res.text().then(txt => JSON.parse(txt, vanillaReviver))

        console.log('STATUS', res.status)
        expect(res.status).toBe(200)
        expect(body).toHaveLength(3)

        // expect(res.headers["content-type"]).toMatch(/json/)
        // expect(res.body[0].category).toHaveLength(4)
        // expect(res.body[0].category[3].name).toBe("superdeepOFTG")

    })
})
