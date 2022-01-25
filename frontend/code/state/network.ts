import { serverHost, serverPort } from 'common/config'
import { Item, Query } from 'common/types'

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

    socketErrorHandler(err: ErrorEvent) {
        console.error(err)
    }

    socketMessageHandler(msg: MessageEvent) {
        if (msg.data == 'done') {
            console.log('DONE!!!')
            return
        }
    }
}





// setup http connection to the backend
export class HttpClient {
    url: string

    constructor(url: string) {
        this.url = url
    }

    // return items + tags + categories
    // used in the creation 
    async all(query: Query) {

    }

    //  ==========  ITEMS  ==========

    async getItems(query: Query) {
        const response = await fetch('/logout')
    }

    async updateItems() {
        const data = {}

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })


    }

    async createItem(item: Item) {

    }

    async deleteItems() {
        const response = await fetch(`/site/${id}`, { method: 'DELETE' })
        if (response.status != 200) {
            return displayModalError('#modal-error-box', 'failed to delete site')
        }
    }



}