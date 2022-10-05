import { server } from 'backend/server'
import { existsSync, mkdirSync } from 'node:fs'

import { STORAGE_DIRECTORY, SERVER_PORT } from 'backend/config'

// ensure that the folders are up and running
existsSync(`${STORAGE_DIRECTORY}/icons`) || mkdirSync(`${STORAGE_DIRECTORY}/icons`)
existsSync(`${STORAGE_DIRECTORY}/images`) || mkdirSync(`${STORAGE_DIRECTORY}/images`)
existsSync(`${STORAGE_DIRECTORY}/thumbnails`) || mkdirSync(`${STORAGE_DIRECTORY}/thumbnails`)

// start the server
server.listen(SERVER_PORT, () => {
  console.log(`Listening on ${SERVER_PORT} in dir ${__dirname}\n@ ${new Date().toISOString()}`)
})
