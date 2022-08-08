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











async function getTagSuggestions(tagsString: string) {
  const tags = tagsString.split(':')

  // if split
  if (tags.length == 0 || (tags.length == 1 && tags[0] == '')) {
      return await prisma.tag.findMany()
  } else if (tags.length == 1) {
      return await prisma.tag.findMany({where: {name: {contains: tags[0]}}})
  } else {
      const firstParent = tags[0] == '' ? null : { name: tags[0] }
      if (tags.length == 2) {
          return await prisma.tag.findMany({where: { name: { contains: tags[1]}, parent: firstParent}})
      } else if (tags.length == 3) {
          // console.dir({name: { contains: tags[2]}, parent: { name: tags[1], parent: firstParent}})
          return await prisma.tag.findMany({
              where: {name: { contains: tags[2]}, parent: { name: tags[1], parent: firstParent}}
          })
          
      } else if (tags.length == 4) {
          return await prisma.tag.findMany({
              where: { 
                  name: { contains: tags[3]}, 
                  parent: { name: tags[2], parent: { name: tags[1], parent: firstParent}}}
          })
                      
      } else {
          console.log('MAX TAGS EXCEEDED')
          return []
      }
  }
}


async function getTextSuggestions({type, value}: { type: 'title' | 'body' | 'uri', value: string}) {
  if (type == 'title') {
    return await prisma.node.findMany({where: {title: { contains: value}}, take: 100})
  } else if (type == 'body') {
    return await prisma.node.findMany({where: { leafs: { some: { content: { contains: value }}},
    OR: { title: {contains: value}}}, take: 100})
  } else if (type == 'uri') {
    console.log(`uri: ${value}`)
    return await prisma.node.findMany({where: { uri: { contains: value}}, take: 100})
  } else {
    console.log(`null`)
    return []
  }
}

routes.post('/suggestions', async (req, res) => {
  const body = req.body
  console.dir(req.body)
  if (body.type == 'tags') {
    const results = await getTagSuggestions(req.body.value)
    return res.json(results)
  } else if (body.type == 'text') {
    const results = await getTextSuggestions(req.body.value)
    return res.json(results)
  } else {
    return res.json([])
  }

})







export default routes
