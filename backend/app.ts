import { server } from 'backend/server'
import { serverPort } from 'common/config'

server.listen(serverPort, () => {
    console.log(`Listening on ${serverPort} in dir ${__dirname}\n@ ${new Date().toISOString()}`)
})