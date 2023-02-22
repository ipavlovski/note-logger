import cors from 'cors'
import express, { json } from 'express'
import { readFileSync } from 'fs'
import { createServer as createSecureServer, ServerOptions } from 'https'
import morgan from 'morgan'
import * as trpcExpress from '@trpc/server/adapters/express'

import { appRouter, createContext } from 'backend/routes'
import { STORAGE_DIRECTORY } from 'backend/config'

// main server object
const app = express()

// middlware
app.use(json())
app.use(cors())

// logging stuff
app.use(morgan(':method :url :response-time'))

// serve the static files
// app.use(express.static(`${__dirname}/../dist`))
app.use(express.static(STORAGE_DIRECTORY))

// use the routes
app.use( '/trpc', trpcExpress.createExpressMiddleware({ router: appRouter, createContext, }), )
// app.use(routes)

// create HTTPS server
const credentials: ServerOptions = {
  key: readFileSync(`${process.env.HOME}/.config/ssl/homelab/homelab.key`, 'utf8'),
  cert: readFileSync(`${process.env.HOME}/.config/ssl/homelab/homelab.crt`, 'utf8')
}
export default createSecureServer(credentials, app)
