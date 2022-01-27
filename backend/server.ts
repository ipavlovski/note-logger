import routes from 'backend/routes'
import { WSS } from 'backend/websocket'
import { jsonReviver } from 'common/utils'
import express, { json } from 'express'
import { createServer } from 'http'
import morgan from 'morgan'

const app = express()

app.use(json({ reviver: jsonReviver }))

morgan.token('session', (req: any) => {
    return req.user?.id ?? 'anon'
})
app.use(morgan(':session :method :url :response-time'))

app.use(express.static(`${__dirname}/../dist`))

app.use(routes)

const server = createServer(app)
const wss = new WSS(server)

export { server, wss }
