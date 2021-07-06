import express from 'express'
import morgan from 'morgan'
import createError from 'http-errors'

const server = express()

// server.set('views', `${__dirname}/views`)
server.set('views', `views`)
server.set('view engine', 'pug')

server.use(morgan('dev'))
server.use(express.json())
server.use(express.urlencoded({ extended: false }))
server.use(express.static(`public`))

// catch 404 and forward to error handler
// server.use(function (req, res, next) {
//     next(createError(404))
// })

export { server }