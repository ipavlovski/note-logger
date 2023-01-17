import { existsSync, mkdirSync } from 'node:fs'

import { server } from 'backend/server'
import { STORAGE_DIRECTORY, SERVER_PORT } from 'backend/config'

// ensure that the folders are up and running
const dirs = ['icons', 'images', 'preview', 'files']
dirs.forEach(
  dir => existsSync(`${STORAGE_DIRECTORY}/${dir}`) || mkdirSync(`${STORAGE_DIRECTORY}/${dir}`)
)

// start the server
server.listen(SERVER_PORT, () => {
  console.log(`Listening on ${SERVER_PORT} in dir ${__dirname}\n@ ${new Date().toISOString()}`)
})
