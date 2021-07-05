import express from 'express'

const server = express()
server.use(express.urlencoded({ extended: true }))
server.use(express.json())

// top-level route
server.get("/", async (req, res) => res.json('Server is running!'))

export { server }