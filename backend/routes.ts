import { ErrorHandler } from 'backend/error-handler'
import { genericFilter } from 'backend/handlers/generic'
import { redditFilter } from 'backend/handlers/reddit'
import { stackExchangeFilter } from 'backend/handlers/stack-exchange'
import { youtubeFilter } from 'backend/handlers/youtube'
import { Router } from 'express'
import { z } from 'zod'
import { URL } from 'url'
import FormData from 'form-data'
import { Blob } from 'node:buffer'

const routes = Router()

import multer from 'multer'
import { readFile, writeFile } from 'fs/promises'
// const mult = multer()
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

////////////// QUERY

const QueryBody = z.object({
  username: z.string(),
})
type QueryBody = z.infer<typeof QueryBody>

routes.post('/query', async (req, res) => {
  try {
    const query = QueryBody.parse(req.body)
    res.send('YES!')
  } catch (error) {
    console.log('select error')
  }
})

////////////// PARSE URL

const UrlBody = z.object({
  url: z.string().url(),
})
type UrlBody = z.infer<typeof UrlBody>

routes.post('/url', async (req, res) => {
  try {
    const body = UrlBody.parse(req.body)
    const url = new URL(body.url)

    const filters = [youtubeFilter, redditFilter, stackExchangeFilter, genericFilter]
    for (const fun of filters) {
      const results = await fun(url)
      if (results != null) return res.json(results)
    }

    res.json({ results: 'no matches...' })
  } catch (error) {
    const err = ErrorHandler(error)
    res.json(err)
  }
})

////////////// CREATE A NEW NODE

const CreateNode = z.object({
  parent: z.number().optional(),
  title: z.string(),
  uri: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  category: z.string().array(),
  tags: z.string().array(),
})
type CreateNode = z.infer<typeof CreateNode>

// to create a node, need to go through a series of constraints
function createNode(reqBody: CreateNode) {
  return {}
}

routes.put('/node', async (req, res) => {
  try {
    const body = CreateNode.parse(req.body)
    const results = createNode(body)
    res.json(results)
  } catch (error) {
    const err = ErrorHandler(error)
    res.json(err)
  }
})

routes.post('/multi', upload.single('avatar'), async (req, res) => {
  console.log('------')
  console.log(req.file)
  if (req.file) {
    await writeFile('image-1.png', req.file.buffer)
    console.log('written file image-1.png')
  }
  console.log(req.body)

  var form = new FormData()
  form.append('my_field', 'my value')
  form.append('my_other', 'other value')

  var image = await readFile('image-2.png')
  const tmp = image.toString('base64')
  // const tmp = new Blob(image., { type: 'image/png' });
  var prop = 'asdf'

  // res.setHeader('Content-Type', 'multipart/form-data').send(form)
  res.json({ tmp, prop })
})

routes.post('/multi2', async (req, res) => {
  console.log(req.body)
  res.json('lol')
})


export default routes
