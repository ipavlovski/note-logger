import express, { json } from 'express'
import { DateTime } from 'luxon'
import morgan from 'morgan'

import { db, webSocketServer } from 'backend/app'
import { jsonReviver } from 'common/utils'
import { Query } from 'common/types'

//  ==========  MAIN EXPRESS SERVER  ==========

const server = express()

// DateTime.now().toString() -> '2022-01-16T13:37:00.602-04:00'
// DateTime.now().toUTC().toString() -> '2022-01-16T17:37:20.611Z'
// JSON.parse(json, jsonReviver)
server.use(json({ reviver: jsonReviver }))

morgan.token('session', (req: any) => {
    return req.user?.id ?? 'anon'
})
server.use(morgan(':session :method :url :response-time'))

server.use(express.static(`${__dirname}/../dist`))






//  ==========  ROUTES  ==========

// query the DB with a large query (and possibly paging)
// send back a json-array of items (with 200 status)
// on failure, send 400 with a JSON message on what went wrong (from try-catch)
// no websocket action - purely synchronous http request/response
server.post('/select', async (req, res) => {
    // body contains the query object
    const query: Query = req.body

    try {
        const results = await db.queryItems(query, 'preview')
        return res.json(results)
    } catch (error) {
        return res.status(400).json({ error: error.name, message: error.message })
    }
})

// create a new site
// receive item-contents (no id), and try to create the item
// on success send-out 201 (created), on failure send out 400 (bad request)
// broadcast the created item through websocket (single sql query)
server.put('/insert', async (req, res) => {
    // body contains item object
    const item = req.body
    console.log('Number of clients:', webSocketServer.wss.clients.size)

    const castable = await db.insertItem(item)

    webSocketServer.sockets.map(socket => socket.send(JSON.stringify(castable)))
    res.sendStatus(201)
})

// update one or many items
// this is where content, dates, tags, categories, archived are changed
// on success, send 200 code (no json)
// on failure, send 400 code with json messsage
// websocket - use the RETURNING clause to get all affected items
server.post('/update', async (req, res) => {
    // 3 types of ranges: query, id-range, single-id
    // 3 types of tag updates: set, add, remove
    const body = req.body
    res.sendStatus(200)
})

// delete an item
// on success, send 200 code (no json)
// on failure, sedn 400 code with json message
// websocket : send out a json with info on deleted ID
server.delete('/delete/:id', async (req, res) => {
    res.sendStatus(200)
})


// receive tag/category rename request
// on success, send 200 (no json)
// on failure, send 400 with json-message
// websocket: send out a json with renaming info
server.post('/rename', async (req, res) => {
    // body should contain identification of 
    // on success,
    const body = req.body
    console.log(body)
    res.sendStatus(200)
})

// refresh tags and category tables on the server
// process orphaned categories/tags
// send-out JSON objects of categories/tags
// maybe do it through the websockets?
server.get('/refresh', async (req, res) => {
    res.sendStatus(200)
})

export default server
