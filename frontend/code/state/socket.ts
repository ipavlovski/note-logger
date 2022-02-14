import { serverHost, serverPort } from 'common/config'

// setup websock connection to the backend
export class BroadcastReceiver {
    url: string
    socket: WebSocket

    constructor(url: string) {
        this.url = url
        this.socket = new WebSocket(url)

        this.socket.addEventListener('error', this.socketErrorHandler)
        this.socket.addEventListener('open', this.socketOpenHandler)
        this.socket.addEventListener('close', this.socketCloseHandler)
        this.socket.addEventListener('message', this.socketMessageHandler)
    }

    socketOpenHandler() {
        console.log('Opening up websocket!')
    }
    socketCloseHandler() {
        console.log('Closing down websocket!')
    }

    // event: ErrorEvent
    socketErrorHandler(err: Event) {
        
        console.error(err)
    }

    socketMessageHandler(msg: MessageEvent) {
        console.log('MSG RECEIVED!')
        if (msg.data == 'done') {
            console.log('DONE!!!')
            return
        }
    }
}

// export const receiver = new BroadcastReceiver(`ws://${serverHost}:${serverPort}`)