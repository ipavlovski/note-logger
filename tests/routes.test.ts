import { server } from 'backend/server'
import { CatRow, TagRow, Item, Castable, CatQuery, TagQuery, ItemRow, Query, UpdateItemOne, UpdateItemMany, InsertItem } from 'common/types'
import { Server } from 'http'
import { DateTime } from 'luxon'
import { WebSocket } from 'ws'
import fetch from 'node-fetch'
import { serverPort } from 'common/config'
import { db, DB } from 'backend/db'
import { vanillaReviver } from 'common/utils'

let httpServer: Server

function startServer(port: number) {
    return new Promise<Server>((resolve) => {
        server.listen(port, () => {
            console.log(`TEST SERVER LISTENING ON PORT: ${serverPort}`)
            resolve(server)
        })
    })
}

function waitForSocketState(socket: WebSocket, state: number) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            (socket.readyState === state) ?
                resolve(true) : waitForSocketState(socket, state).then(resolve)
        }, 50)
    })
}

async function createSocketClient() {
    const client = new WebSocket(`ws://localhost:${serverPort}`)
    await waitForSocketState(client, client.OPEN)
    let messages: string[] = []
    client.on('message', (data) => {
        messages.push(data.toString())
        client.close()
    })
    return [client, messages] as [WebSocket, string[]]
}



beforeAll(async () => httpServer = await startServer(serverPort))
afterAll(() => httpServer.close())


beforeEach(async () => {
    await db.init()
    await db.populate('./db-test-main.sqlite')
})

afterEach(async () => {
    await db.clear()
})


describe('HTTP-SELECT', () => {

    test('basic select', async () => {
        const testdb = new DB(':memory:', false)
        await testdb.init()
        await testdb.populate('./db-test-main.sqlite')

        var catInput: CatQuery = {
            rec: await testdb.all<CatRow>('select * from category where id in (3)'),
            term: await testdb.all<CatRow>('select * from category where id in (46, 448)')
        }

        var tagInput: TagQuery = [
            await testdb.all<TagRow>('select * from tag where id IN (11, 14)'),
            await testdb.all<TagRow>('select * from tag where id=7'),
        ]

        const query: Query = {
            type: 'preview',
            tags: tagInput,
            cats: catInput
        }

        // await db.populate('./db-test-main.sqlite')

        const res = await fetch(`http://localhost:${serverPort}/select`, {
            method: 'POST',
            body: JSON.stringify(query),
            headers: { 'Content-Type': 'application/json' }
        })
        const body = await res.json()

        console.log('STATUS', res.status)
        expect(res.status).toBe(200)
        expect(body).toHaveLength(3)

        // expect(res.headers["content-type"]).toMatch(/json/)
        // expect(res.body[0].category).toHaveLength(4)
        // expect(res.body[0].category[3].name).toBe("superdeepOFTG")

    })
})




describe('SOCKET-BASED', () => {

    // this was done to prevent 'hangups' -- maybe still NEED this?
    // afterEach(async () => await waitForSocketState(client, client.CLOSED))
    // let client: WebSocket

    test('ping/pong', async () => {
        const [client, messages] = await createSocketClient()
        client.send(JSON.stringify("ping"))
        await waitForSocketState(client, client.CLOSED)

        // this destructing is 'calling of a reference'
        const [message] = messages
        expect(message).toBe("pong")
    }, 2000)

    test('insert query', async () => {
        const [client, messages] = await createSocketClient()

        // 2. PREP THE INPUT DATA
        var inputCats: CatRow[] = [
            { id: null, pid: null, name: 'Cat-New1' }, { id: null, pid: null, name: 'Cat-New2' }
        ]

        var inputTags: TagRow[] = [
            { id: null, name: 'tag-new1' }, { id: null, name: 'tag-new2' },
        ]

        var inputItem: InsertItem = {
            header: 'header-123',
            created: DateTime.now().toJSDate(),
            category: inputCats,
            tags: inputTags
        }

        // 3. SEND THE DATA OVER
        const res = await fetch(`http://localhost:${serverPort}/insert`, {
            method: 'PUT',
            body: JSON.stringify(inputItem),
            headers: { 'Content-Type': 'application/json' }
        })

        // 4. PROCESS RESULTS
        expect(res.status).toBe(201)

        // Perform assertions on the response
        await waitForSocketState(client, client.CLOSED)
        const [message] = messages
        const result: Castable = JSON.parse(message, vanillaReviver)

        expect(result.insert!.map(({ type }) => type)).toEqual(['cat', 'cat', 'tag', 'tag', 'item'])
        const metadata = [
            { type: "cat", value: { id: 301, pid: null, name: "Cat-New1", }, },
            { type: "cat", value: { id: 302, pid: 301, name: "Cat-New2", }, },
            { type: "tag", value: { id: 21, name: "tag-new1", }, },
            { type: "tag", value: { id: 22, name: "tag-new2", }, },
        ]
        expect(result.insert!.slice(0, 4)).toMatchObject(metadata)

        const outputItem = result.insert![4].value as Item
        expect(outputItem.created.toISOString().substring(0, 16)).toBe(inputItem.created.toISOString().substring(0, 16))
        expect(outputItem.header).toEqual(inputItem.header)

    }, 5000)


    test('update one', async () => {
        // 1. PREP THE SOCKET
        const [client, messages] = await createSocketClient()

        // 2. PREP THE INPUT
        var inputTags: TagRow[] = [{ id: null, name: 'tag-new' }, { id: 5, name: 'tag4' }]
        var inputCats: CatRow[] = [
            { id: null, pid: null, name: 'Cat-Parent' },
            { id: null, pid: null, name: 'Cat-Child' }
        ]
        var item: UpdateItemOne = {
            header: 'header-123',
            body: { md: '', html: '' },
            created: new Date(),
            updated: null,
            archived: false,
            category: inputCats,
            tags: inputTags
        }

        var startingState = await db.get<ItemRow>('select * from item where id = 123')

        // 3. SEND THE INPUT
        const res = await fetch(`http://localhost:${serverPort}/update/123`, {
            method: 'POST',
            body: JSON.stringify(item),
            headers: { 'Content-Type': 'application/json' }
        })
        expect(res.status).toBe(200)

        // 4. WAIT FOR OUTPUT
        await waitForSocketState(client, client.CLOSED)
        const [message] = messages
        const result: Castable = JSON.parse(message)
        expect(result.insert).toHaveLength(3)
        expect(result.update).toHaveLength(1)


        var finishedState = await db.get<ItemRow>('select * from item where id = 123')
        expect(startingState.category_id).not.toBe(finishedState.category_id)
    })



    test('update many', async () => {
        // 1. PREP THE SOCKET
        const [client, messages] = await createSocketClient()

        // 2. PREP THE INPUT
        const ids = [123, 125, 250]
        const op = 'add'
        const inputTags: TagRow[] = [{ id: null, name: 'tag-new' }, { id: 5, name: 'tag4' }]
        const inputCats: CatRow[] = [
            { id: null, pid: null, name: 'Cat-Parent' },
            { id: null, pid: null, name: 'Cat-Child' }
        ]
        const item: UpdateItemMany = {
            created: new Date(),
            updated: null,
            archived: false,
            category: inputCats,
            tags: inputTags
        }
        const startingState = await db.all<ItemRow>(`select * from item where id IN (${ids.join(', ')})`)

        // 3. SEND THE INPUT
        const res = await fetch(`http://localhost:${serverPort}/update`, {
            method: 'POST',
            body: JSON.stringify({ ids, item, op }),
            headers: { 'Content-Type': 'application/json' }
        })
        expect(res.status).toBe(200)

        // 4. WAIT FOR OUTPUT
        await waitForSocketState(client, client.CLOSED)
        const [message] = messages
        const result: Castable = JSON.parse(message)
        expect(result.insert).toHaveLength(3)
        expect(result.update).toHaveLength(3)

        var finishedState = await db.all<ItemRow>(`select * from item where id IN (${ids.join(', ')})`)
        expect(startingState[0].category_id).not.toBe(finishedState[0].category_id)
    })



    test('delete', async () => {
        // 1. PREP THE SOCKET
        const [client, messages] = await createSocketClient()

        // 2. PREP THE INPUT
        const id = 123

        const startingState = await db.get<ItemRow>(`select * from item where id = ${id}`)

        // 3. SEND THE INPUT
        const res = await fetch(`http://localhost:${serverPort}/delete/${id}`, {
            method: 'DELETE'
        })
        expect(res.status).toBe(200)

        // 4. WAIT FOR OUTPUT
        await waitForSocketState(client, client.CLOSED)
        const [message] = messages
        const result: Castable = JSON.parse(message)
        expect(result.delete).toHaveLength(1)

        var finishedState = await db.get<ItemRow>(`select * from item where id = ${id}`)
        expect(startingState.id).toBe(123)
        expect(finishedState).toBe(undefined)
    })

    test('rename category', async () => {
        // 1. PREP THE SOCKET
        const [client, messages] = await createSocketClient()

        // 2. PREP THE INPUT
        const input = { id: 41, name: 'new-cat1', type: 'cat' }

        const stateBefore = await db.get<CatRow>(`select * from category where id = ${input.id}`)
        expect(stateBefore.id).toBe(input.id)
        expect(stateBefore.name).not.toBe(input.name)

        // 3. SEND THE INPUT
        const res = await fetch(`http://localhost:${serverPort}/rename`, {
            method: 'POST',
            body: JSON.stringify(input),
            headers: { 'Content-Type': 'application/json' }
        })
        expect(res.status).toBe(200)

        // 4. WAIT FOR OUTPUT
        await waitForSocketState(client, client.CLOSED)
        const [message] = messages
        const result: Castable = JSON.parse(message)
        expect(result.rename).toHaveLength(1)

        const stateAfter = await db.get<CatRow>(`select * from category where id = ${input.id}`)
        expect(stateAfter.id).toBe(input.id)
        expect(stateAfter.name).not.toBe(stateBefore.name)
    })


})




