import { server } from 'backend/server'
import { SERVER_PORT, STORAGE_DIRECTORY } from 'common/config'
import { existsSync, mkdirSync } from 'node:fs'

// ensure that the folders are up and running
existsSync(`${STORAGE_DIRECTORY}/icons`) || mkdirSync(`${STORAGE_DIRECTORY}/icons`)
existsSync(`${STORAGE_DIRECTORY}/images`) || mkdirSync(`${STORAGE_DIRECTORY}/images`)
existsSync(`${STORAGE_DIRECTORY}/backsplashes`) || mkdirSync(`${STORAGE_DIRECTORY}/backsplashes`)
existsSync('/tmp/note-logger') || mkdirSync('/tmp/note-logger')

// start the server
server.listen(SERVER_PORT, () => {
  console.log(`Listening on ${SERVER_PORT} in dir ${__dirname}\n@ ${new Date().toISOString()}`)
})    
