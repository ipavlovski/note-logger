import { wss } from 'backend/server'
import { Router } from 'express'


const routes = Router()

routes.get('/select', async (req, res) => {
    try {
        res.send('YES!')
    } catch (error) {
        console.log('select error')
    }
})

routes.put('/insert', async (req, res) => {
    try {
        const castable = {}
        wss.broadcast({})
        return res.sendStatus(201)
    } catch (error) {
        return res.status(400).json('Something happened...')
    }
})


export default routes