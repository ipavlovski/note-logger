import { server } from 'src/server'
import { router as apiRoutes } from 'src/api'
import { serverPort } from 'src/config'

console.log("Starting the application")

// import various routes
console.log("Initializing the server routes")
server.use(apiRoutes)

// start the express server
server.listen(serverPort, () => console.log(`Service started on ${serverPort}`));

// terminate gracefully
["exit", "SIGINT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(eventType => {
    process.on(eventType, exitCode => {
        console.log(`Handling ${eventType}. exitCode = ${exitCode}`)
        process.exit()
    })
})