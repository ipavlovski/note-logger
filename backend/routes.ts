import { Router } from 'express'
import FormData from 'form-data'

const routes = Router()

import { readFile, writeFile } from 'fs/promises'
import multer from 'multer'
// const mult = multer()
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

import { PrismaClient } from '@prisma/client'
import { queryHist } from 'backend/db'
import { DateTime } from 'luxon'

const prisma = new PrismaClient()

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





routes.get('/history/:date', async (req, res) => {
  var date = req.params.date
  if (date != null && DateTime.fromISO(date).isValid) {
    const masterAcc = await queryHist(date)
    return res.json(masterAcc)
  } else {
    return res.json('ERROR')
  }
})

routes.get('/node/:id', async (req, res) => {
  var id = parseInt(req.params.id)

  const node = await prisma.node.findFirst({ where: { id: id}, include: { 
    parent: true,
    children: true,
    leafs: true,
    history: true,
    icon: true,
    backsplash: true,
    metadata: true,
    tags: true
  }})

  return res.json(node)

})

routes.post('/leaf/:id', async (req, res) => {
  var leafId = parseInt(req.params.id)
  var content = req.body.content

  await prisma.leaf.update({ where: { id: leafId}, data: { content: content }})
  return res.sendStatus(200)
})

routes.put('/node/:id/leaf', async (req, res) => {
  var id = parseInt(req.params.id)

  await prisma.node.update({ where: { id: id}, data: { leafs: { create: {
    content: 'new.'
  }}}})

  return res.sendStatus(200)
})



export default routes
