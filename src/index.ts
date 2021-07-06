import { server } from 'src/server'
import { router } from 'src/router'
import { serverPort } from 'src/config'


server.use(router)
server.listen(serverPort, () => console.log(`Service started on ${serverPort}`));


// handle termination and user signals
["SIGINT", "SIGTERM", "SIGUSR1", "SIGUSR2"].forEach(eventType => {
    process.on(eventType, () => {

        switch (eventType) {
            case "SIGINT":
            case "SIGTERM":
                console.log(`Event ${eventType} received, proceeding to exit.`)
                break
            case "SIGUSR1":
            case "SIGUSR2":
                console.log(`Event ${eventType} received, proceeding to exit.`)
                break
        }

        process.exit(0)
    })
})


// handling exceptions
// process.on("uncaughtException", error => {
//     console.error(`\nUNCAUGHT EXCEPTION:\n${error}`)
//     process.exit(1)
// })

// cleanup, if necessary
process.on("exit", exitCode => {
    console.log(`Cleanup. Exit = ${exitCode}`)
})
