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


describe('PING sockets/database', () => {

    test('ping sockets', async () => {
        const [client, messages] = await createSocketClient()
        client.send(JSON.stringify("ping"))
        await waitForSocketState(client, client.CLOSED)

        // this destructing is 'calling of a reference'
        const [message] = messages
        expect(message).toBe("pong")
    }, 2000)

})


describe('INSERT', () => {

    test('first insert', async () => {
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

        const outputItem = result.insert![4].value as Item
        expect(outputItem.header).toEqual(inputItem.header)

    }, 20000)

})