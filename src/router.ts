import express from "express"
import fs from 'fs/promises'
import { files, md } from 'src/markdown'

const router = express.Router()


router.get('/', async (req, res) => {
    console.log("RENDERING:")
    res.render('index', { title: 'EXPRESS TEST' });
})

router.get('/parse/:id', async (req, res) => {
    const id = parseInt(req.params.id)
    const file = await fs.readFile(files[id]).then(buffer => buffer.toString())
    const html = md.render(file)
    res.json(html)
})


export { router }