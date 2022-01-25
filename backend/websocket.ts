import { exec } from 'child_process'
import { IncomingMessage, Server as HttpServer } from 'http'
import internal from 'stream'
import { Server as WSServer, WebSocket } from 'ws'

export class WSS {
    wss: WSServer
    sockets: WebSocket[] = []

    constructor(server: HttpServer) {
        console.log('Initiating the AuthWebsocketServer')
        this.wss = new WSServer({ noServer: true, clientTracking: true }, () => {
            console.log('WSS server callback')
        })
        server.on('upgrade', this.onUpgradeHandler)
        this.wss.on('connection', this.onConnectionHandler)
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
    }
}



export default WSS