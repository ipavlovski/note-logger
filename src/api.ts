import express from "express"

const router = express.Router()

router.get('/route1', async (req, res) => {
    res.json('hello from route1')
})
router.post('/route1', async (req, res) => {
    const input = req.body.input
    res.json(`input received: ${input}`)
})

export { router }