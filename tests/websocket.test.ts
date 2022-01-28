import { server } from 'backend/server'
import { CatRow, TagRow, Item, Castable } from 'common/types'
import { Server } from 'http'
import { DateTime } from 'luxon'
import { WebSocket } from 'ws'
import fetch from 'node-fetch'
import { jsonReviver } from 'common/utils'
import { serverPort } from 'common/config'
import { db } from 'backend/db'

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

        }, 100)
    })
}



describe('SOCKET', () => {
    let client: WebSocket

    beforeAll(async () => httpServer = await startServer(serverPort))
    afterAll(() => httpServer.close())
    afterEach(async () => await waitForSocketState(client, client.CLOSED))


    test('ping/pong', async () => {
        client = new WebSocket(`ws://localhost:${serverPort}`)
        await waitForSocketState(client, client.OPEN)

        // check for response data
        let responseMessage
        client.on("message", (data) => {
            console.log('DATA', data.toString())
            responseMessage = data.toString()
            // Close the client after it receives the response
            client.close()
        })

        // Send client message
        client.send(JSON.stringify("ping"))

        // Perform assertions on the response
        await waitForSocketState(client, client.CLOSED)
        expect(responseMessage).toBe("pong")
    }, 5000)

    test('insert query', async () => {

        // 1. PREP THE SOCKET
        client = new WebSocket(`ws://localhost:${serverPort}`)
        await waitForSocketState(client, client.OPEN)

        // check for response data
        let responseMessage
        client.on("message", (data) => {
            responseMessage = data.toString()
            // Close the client after it receives the response
            client.close()
        })

        // 2. PREP THE INPUT DATA

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
        const result: Castable = JSON.parse(responseMessage, jsonReviver)

        expect(result.insert.map(({ type }) => type)).toEqual(['cat', 'cat', 'tag', 'tag', 'item'])
        const metadata = [
            { type: 'cat', value: { id: 1, pid: null, name: 'Cat10' } },
            { type: 'cat', value: { id: 2, pid: 1, name: 'Cat13' } },
            { type: 'tag', value: { id: 1, name: 'tag10' } },
            { type: 'tag', value: { id: 2, name: 'tag11' } }
        ]
        expect(result.insert.slice(0, 4)).toEqual(metadata)

        const outputItem = result.insert[4].value as Item
        expect(outputItem.created.toSeconds()).toBeCloseTo(inputItem.created.toSeconds())
        expect(outputItem.header).toEqual(inputItem.header)

    }, 5000)


    test.only('update query', async () => {

        // 0. SEED DATABASE
        await db.init()
        await db.populate('./db-test-main.sqlite')

        // 1. PREP THE SOCKET
        client = new WebSocket(`ws://localhost:${serverPort}`)
        await waitForSocketState(client, client.OPEN)

        // check for response data
        let responseMessage
        client.on("message", (data) => {
            responseMessage = data.toString()
            // Close the client after it receives the response
            client.close()
        })


        // 2. PREP THE INPUT
        var inputItem = {}

        // 3. SEND THE INPUT
        const res = await fetch(`http://localhost:${serverPort}/update`, {
            method: 'PUT',
            body: JSON.stringify(inputItem),
            headers: { 'Content-Type': 'application/json' }
        })

        await waitForSocketState(client, client.CLOSED)

        // 4. PROCESS RESULTS
        expect(res.status).toBe(200)

        // Perform assertions on the response
        const result: Castable = JSON.parse(responseMessage, jsonReviver)

    }, 2000)
})




