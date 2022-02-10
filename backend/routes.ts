import { db } from 'backend/db'
import { wss } from 'backend/server'
import { IdCoercion, InsertItemSchema, QuerySchema, RenameRouteSchema, UpdateItemOneSchema, UpdateRouteSchema } from 'backend/validation'
import { ExceptionHandler } from 'common/errors'
import { Router } from 'express'
import { create } from 'superstruct'


const routes = Router()

//  ==========  ROUTES  ==========

// query the DB with a large query (and possibly paging)
// send back a json-array of items (with 200 status)
// on failure, send 400 with a JSON message on what went wrong (from try-catch)
// no websocket action - purely synchronous http request/response
routes.post('/select', async (req, res) => {
    try {
        const query = create(req.body, QuerySchema)
        const results = await db.queryItems(query)
        return res.status(200).send(JSON.stringify(results))
    } catch (error) {
        const msg = new ExceptionHandler(error).toJSON()
        return res.status(400).json(msg)
    }
})

// create a new site
// receive item-contents (no id), and try to create the item
// header + created : mandatory
routes.put('/insert', async (req, res) => {
    try {
        const item = create(req.body, InsertItemSchema)
        const castable = await db.insertItem(item)
        wss.broadcast(castable)
        return res.sendStatus(201)
    } catch (error) {
        const msg = new ExceptionHandler(error).toJSON()
        return res.status(400).json(msg)
    }
})


routes.post('/update/:id', async (req, res) => {
    try {
        const id = create(req.params.id, IdCoercion)
        const item = create(req.body, UpdateItemOneSchema)
        const castable = await db.updateOne({ id, item })
        wss.broadcast(castable)
        return res.sendStatus(200)
    } catch (error) {
        const msg = new ExceptionHandler(error).toJSON()
        return res.status(400).json(msg)
    }
})

routes.post('/update', async (req, res) => {
    try {
        const { ids, item, op } = create(req.body, UpdateRouteSchema)
        const castable = await db.updateMany({ ids, item, op })
        wss.broadcast(castable)
        return res.sendStatus(200)
    } catch (error) {
        const msg = new ExceptionHandler(error).toJSON()
        return res.status(400).json(msg)
    }
})


// delete an item
// on success, send 200 code (no json)
// on failure, sedn 400 code with json message
// websocket : send out a json with info on deleted ID
routes.delete('/delete/:id', async (req, res) => {
    try {
        const id = create(req.params.id, IdCoercion)
        const castable = await db.deleteItem(id)
        wss.broadcast(castable)
        return res.sendStatus(200)
    } catch (error) {
        const msg = new ExceptionHandler(error).toJSON()
        return res.status(400).json(msg)
    }
})


// receive tag/category rename request
// on success, send 200 (no json)
// on failure, send 400 with json-message
// websocket: send out a json with renaming info
routes.post('/rename', async (req, res) => {
    try {
        const { id, type, name } = create(req.body, RenameRouteSchema)
        const castable = (type == 'tag') ?
            await db.renameTag(id, name) : await db.renameCat(id, name)
        wss.sockets.map(socket => socket.send(JSON.stringify(castable)))
        return res.sendStatus(200)
    } catch (error) {
        const msg = new ExceptionHandler(error).toJSON()
        return res.status(400).json(msg)
    }
})

// refresh tags and category tables on the server
// process orphaned categories/tags
// send-out JSON objects of categories/tags
// maybe do it through the websockets?
routes.get('/refresh', async (req, res) => {
    res.sendStatus(200)
})

export default routes
