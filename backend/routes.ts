import { db } from 'backend/db'
import { wss } from 'backend/server'
import { Castable, Item, ItemUpdate, Query } from 'common/types'
import { Router } from 'express'


const routes = Router()

//  ==========  ROUTES  ==========

// query the DB with a large query (and possibly paging)
// send back a json-array of items (with 200 status)
// on failure, send 400 with a JSON message on what went wrong (from try-catch)
// no websocket action - purely synchronous http request/response
routes.post('/select', async (req, res) => {
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
routes.put('/insert', async (req, res) => {
    // body contains item object
    const item = req.body
    console.log('Number of clients:', wss.wss.clients.size)

    const castable = await db.insertItem(item)

    wss.sockets.map(socket => socket.send(JSON.stringify(castable)))
    res.sendStatus(201)
})

// this is where content, dates, tags, categories, archived are changed
// on success, send 200 code (no json)
// on failure, send 400 code with json messsage
// websocket - use the RETURNING clause to get all affected items
// UPDATE ONE
routes.post('/update/:id', async (req, res) => {
    const item: Item = req.body
    const id = parseInt(req.params.id)

    try {
        const castable = await db.updateOne(id, item)
        wss.sockets.map(socket => socket.send(JSON.stringify(castable)))
        return res.sendStatus(200)
    } catch (error) {
        return res.status(400).json({ error: error.name, message: error.message })
    }
})

routes.post('/update', async (req, res) => {
    const ids: number[] = req.body.ids
    const itemUpdate: Omit<ItemUpdate, 'header' | 'body'>  = req.body.itemUpdate
    const op = req.body.op

    try {
        const castable = await db.updateMany(ids, itemUpdate, op)
        wss.sockets.map(socket => socket.send(JSON.stringify(castable)))
        return res.sendStatus(200)
    } catch (error) {
        return res.status(400).json({ error: error.name, message: error.message })
    }
})


// delete an item
// on success, send 200 code (no json)
// on failure, sedn 400 code with json message
// websocket : send out a json with info on deleted ID
routes.delete('/delete/:id', async (req, res) => {
    const id = parseInt(req.params.id)

    try {
        const castable = await db.deleteItem(id)
        wss.sockets.map(socket => socket.send(JSON.stringify(castable)))
        return res.sendStatus(200)
    } catch (error) {
        return res.status(400).json({ error: error.name, message: error.message })
    }
})


// receive tag/category rename request
// on success, send 200 (no json)
// on failure, send 400 with json-message
// websocket: send out a json with renaming info
routes.post('/rename', async (req, res) => {
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
routes.get('/refresh', async (req, res) => {
    res.sendStatus(200)
})

export default routes
