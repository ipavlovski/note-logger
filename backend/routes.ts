import { ErrorHandler } from 'backend/error-handler'
import { genericFilter } from 'backend/urls/generic'
import { redditFilter } from 'backend/urls/reddit'
import { stackExchangeFilter } from 'backend/urls/stack-exchange'
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


////////////// MULTIHANDLERS

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
