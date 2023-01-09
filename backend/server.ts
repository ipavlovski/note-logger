import cors from 'cors'
import express, { json } from 'express'
import { readFileSync } from 'fs'
import { createServer as createSecureServer, ServerOptions } from 'https'
import morgan from 'morgan'

import { STORAGE_DIRECTORY } from 'backend/config'
// import leafRoutes from 'backend/routes/leaf'
// import nodeRoutes from 'backend/routes/node'
// import queryRoutes from 'backend/routes/query'
import routes from 'backend/routes'

////////////// APP

const app = express()

// middlware
app.use(json())
app.use(cors())

// logging stuff
app.use(morgan(':method :url :response-time'))

// serve the static files
app.use(express.static(`${__dirname}/../dist`))
app.use(express.static(STORAGE_DIRECTORY))

////////////// ROUTES

app.use(routes)
// app.use(leafRoutes)
// app.use(nodeRoutes)
// app.use(queryRoutes)

////////////// HTTPS

var privateKey = readFileSync('secrets/homelab.key', 'utf8')
var certificate = readFileSync('secrets/homelab.crt', 'utf8')
var credentials: ServerOptions = { key: privateKey, cert: certificate }
const server = createSecureServer(credentials, app)

export { server }
