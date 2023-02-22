import { existsSync, mkdirSync } from 'node:fs'
import server from 'backend/server'
import { STORAGE_DIRECTORY, SERVER_PORT } from 'backend/config'

existsSync(STORAGE_DIRECTORY) || mkdirSync(STORAGE_DIRECTORY)

server.listen(SERVER_PORT, () => {
  console.log(`Listening on ${SERVER_PORT} in dir ${__dirname}\n@ ${new Date().toISOString()}`)
})
