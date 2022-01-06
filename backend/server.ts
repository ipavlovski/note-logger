// json-server --watch web/gpl-w2p/db.json --port 5000
// npm run tsnd web/gpl-w2p/server.ts

import express, { json, Request, response, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import fetch from 'node-fetch'
import morgan from 'morgan'

import { Server } from 'ws'
import { exec } from 'child_process'
import { Subject } from 'rxjs'
import { DateTime } from 'luxon'
import JsonServer from 'json-server'


//  ==========  MAIN EXPRESS SERVER  ==========

const expressPort = 3001

const app = express()
app.use(json())

morgan.token('session', (req: any) => {
    return req.user?.id ?? 'anon'
})
app.use(morgan(':session :method :url :response-time'))

app.use(express.static(`${__dirname}/../dist`))

// Vanilla HTTP server is returned, which can be used to handle WS connections
const server = app.listen(expressPort, () => console.log(`Listening on ${expressPort} in dir ${__dirname}`))


//  ==========  JSON SERVER  ==========

const jsonServerPort = 5000
const jsonServerFile = 'db1.json'


const jsonServer = JsonServer.create()
const jsonRouter = JsonServer.router(jsonServerFile)
const jsonMiddlewares = JsonServer.defaults()

jsonServer.use(jsonMiddlewares)
jsonServer.use(jsonRouter)

const dbURL = `http://localhost:${jsonServerPort}`

jsonServer.listen(jsonServerPort, () => {
    console.log(`json-server started on ${dbURL} using ${jsonServerFile}`)
})



// export interface IAuthRequest extends Request {
//     user: User
// }




//  ==========  WEB SOCKETS  ==========

// headless websocket server
const wss = new Server({ noServer: true })

wss.on('connection', async (socket, req) => {
    console.log('WSS CONNECTION for user')


    socket.on('message', async (message) => {
        const msg = JSON.parse(message.toString())
        console.log('ws message:', msg)
        
        if (msg.command == 'exec') {
            const cmd = 'for i in {1..3}; do echo $i; sleep 1; done'
            exec(cmd).on('exit', () => {
                socket.send(JSON.stringify('done'))
            }).stdout.on('data', (v) => {
                socket.send(v)
            })
        }        
    })

    socket.on('close', (code) => {
        console.log(`Socket closed with code=${code}`)
    })
})

// the how-to on how to do express-based server+websockets
// https://github.com/websockets/ws/blob/master/examples/express-session-parse/index.js
server.on('upgrade', (request, socket, head) => {
    console.log('HTTP Server "upgrade"')

    wss.handleUpgrade(request, socket, head, function (ws) {
        wss.emit('connection', ws, request)
    })

})