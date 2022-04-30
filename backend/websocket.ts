import { Castable } from 'common/types'
import { IncomingMessage, Server as HttpServer } from 'http'
import internal from 'stream'
import { Server as WSServer, WebSocket } from 'ws'

class WSS {
    wss: WSServer
    sockets: WebSocket[] = []

    constructor(httpServer: HttpServer) {
        console.log('Initiating the Websocket Server')
        this.wss = new WSServer({ noServer: true, clientTracking: true })
        httpServer.on('upgrade', this.onUpgradeHandler)
        this.wss.on('connection', this.onConnectionHandler)
    }

    // TODO: prep the callback to check for error in broadcast
    broadcast(castable: Castable) {
        console.log(`Broadacasting to %s sockets`, this.sockets.length)
        this.sockets.map(socket => socket.send(JSON.stringify(castable)))
    }

    private onUpgradeHandler = (request: IncomingMessage, socket: internal.Duplex, head: Buffer) => {
        console.log('HTTP Server "upgrade"')

        this.wss.handleUpgrade(request, socket, head, (ws) => {
            this.wss.emit('connection', ws, request)
        })
    }

    private onConnectionHandler = async (socket: WebSocket, request: IncomingMessage) => {
        console.log('CONNECTION!')
        this.sockets.push(socket)

        socket.on('message', async (message) => {
            const msg = JSON.parse(message.toString())
            console.log('MESSAGE:', msg)

            if (msg == 'ping') {
                console.log('SENDING PONG')
                socket.send('pong')
            }

        })

        socket.on('close', (code) => {
            console.log(`Socket closed with code=${code}`)
        })
    }
}


export { WSS }