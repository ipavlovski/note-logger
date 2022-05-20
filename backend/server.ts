import routes from 'backend/routes'
import { WSS } from 'backend/websocket'
import { STORAGE_DIRECTORY } from 'common/config'
import express, { json } from 'express'
import { createServer as createSecureServer, ServerOptions } from 'https'
import { createServer } from 'http'
import morgan from 'morgan'
import { readFileSync } from 'fs'
import cors from 'cors'


const app = express()

app.use(json())
app.use(cors())

morgan.token('session', (req: any) => {
    return req.user?.id ?? 'anon'
})
app.use(morgan(':session :method :url :response-time'))

app.use(express.static(`${__dirname}/../dist`))
app.use(express.static(STORAGE_DIRECTORY!))

app.use(routes)

var privateKey = readFileSync('secrets/homelab.key', 'utf8')
var certificate = readFileSync('secrets/homelab.crt', 'utf8')

var credentials: ServerOptions = { key: privateKey, cert: certificate }

// const server = createSecureServer(credentials, app)
const server = createServer(app)
const wss = new WSS(server)

export { server, wss }
