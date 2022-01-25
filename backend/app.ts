import server from 'backend/server'
import { serverPort } from 'common/config'
import WSS from 'backend/websocket'
import DB from 'backend/db'

// Vanilla HTTP server is returned, which can be used to handle WS connections
const httpServer = server.listen(serverPort, () => console.log(`Listening on ${serverPort} in dir ${__dirname}\n@ ${new Date().toISOString()}`))
const webSocketServer = new WSS(httpServer)
const db = new DB('./db-test-main.sqlite', true)

export { webSocketServer, db }