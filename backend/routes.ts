import { Prisma, PrismaClient } from '@prisma/client'
import { handleURI } from 'backend/handlers/handlers'
import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { writeFile } from 'fs/promises'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { STORAGE_DIRECTORY } from 'backend/config'

const prisma = new PrismaClient()
const routes = Router()
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })



routes.post('/uri', async (req, res) => {
  //   const dateFrom = new Date(req.params.date)

  //   // get the latest
  //   var latestEntry = await prisma.history.findFirst({
  //     orderBy: { visited_at: 'desc' },
  //     where: { visited_at: { lte: dateFrom } },
  //   })

  //   // query history for all elements after the given date
  //   var historyResults = await prisma.history.findMany({
  //     take: 200,
  //     skip: 1, // Skip the cursor
  //     orderBy: { visited_at: 'desc' },
  //     cursor: { visited_at: latestEntry?.visited_at },
  //     include: { node: { include: { icon: true } } },
  //   })

  try {
    // TODO: this should be a zod-validator
    const uri = req.body.uri
    console.log(`the uri: ${uri}`)

    // check if a node already exists
    const existingNode = await prisma.node.findFirst({ where: { uri: uri } })
    if (existingNode != null) throw new Error('Node with URI already exists')

    const result = await handleURI(uri)
    if (! result) throw new Error("Failed to create a node!")

    console.log(`Success creating a node with id: ${result.id}`)
    return res.json({ success: `created a node with URI id: ${result.id}`})
  } catch (err) {
    console.error(err)
    return res.json({ error: err instanceof Error ? err.message : 'unknown error' })
  }
})




const nodeWithIcon = Prisma.validator<Prisma.NodeArgs>()({
  include: { icon: true },
})

export type NodeWithIcon = Prisma.NodeGetPayload<typeof nodeWithIcon>

routes.post('/history', async (req, res) => {
  const results = await prisma.node.findMany({ include: { icon: true } })
  return res.json(results)
})



const nodeWithProps = Prisma.validator<Prisma.NodeArgs>()({
  include: {
    parent: true,
    children: true,
    leafs: { include: { images: true } },
    icon: true,
    preview: true,
    tags: true,
  },
})

export type NodeWithProps = Prisma.NodeGetPayload<typeof nodeWithProps>

routes.get('/node/:id', async (req, res) => {
  try {
    const results: NodeWithProps = await prisma.node.findFirstOrThrow({
      where: { id: parseInt(req.params.id) },
      include: {
        parent: true,
        children: true,
        leafs: { include: { images: true } },
        icon: true,
        preview: true,
        tags: true,
      },
    })
    return res.json(results)
  } catch (err) {
    console.error(err)
    return res.json({ error: err instanceof Error ? err.message : 'unknown error' })
  }
})


export type LeafWithImages = Prisma.LeafGetPayload<typeof leafWithImages>

const leafWithImages = Prisma.validator<Prisma.LeafArgs>()({
  include: {
    images: true,
  },
})

routes.put('/node/:id/leaf', async (req, res) => {
  const nodeId = parseInt(req.params.id)

  const leaf: LeafWithImages = await prisma.leaf.create({
    data: {
      content: '',
      node_id: nodeId,
    },
    include: { images: true },
  })

  return res.json(leaf)
})


routes.post('/leaf/:id/update', async (req, res) => {
  var leafId = parseInt(req.params.id)
  var content = req.body.content

  console.log(content)

  await prisma.leaf.update({ where: { id: leafId }, data: { content: content } })
  return res.json({ success: 1 })
})


routes.delete('/leafs', async (req, res) => {
  const { leafIds } = req.body as { leafIds: number[] }

  try {
    const results = await prisma.leaf.deleteMany({ where: { id: { in: leafIds } } })
    return res.json({ count: results.count })
  } catch (err) {
    console.error(err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return res.status(400).json({ error: msg })
  }
})







routes.post('/node/:id/preview', upload.single('image'), async (req, res) => {
  const nodeId = parseInt(req.params.id)

  try {
    if (req.file == null) throw new Error('Attached file is missing')

    const type = req.file.originalname
    const ext = req.file.mimetype == 'image/png' ? 'png' : 'unknown'

    const path = `preview/${uuidv4()}.${ext}`
    await writeFile(`${STORAGE_DIRECTORY}/${path}`, req.file.buffer)

    const image = sharp(req.file.buffer)
    // const metadata = await image.metadata()
    // if (metadata.width == null || metadata.height == null)
    //   throw new Error('Issue extracting metadata.')

    console.log(`new path: ${path}`)
    await prisma.node.update({
      where: { id: nodeId },
      data: {
        preview: { create: { path: path } },
      },
    })

    return res.json({ path: path })
  } catch (err) {
    console.log(err)
    return res.sendStatus(400)
  }
})


routes.post('/leaf/:id/upload', upload.single('image'), async (req, res) => {
  const leafId = parseInt(req.params.id)

  try {
    if (req.file == null) throw new Error('Attached file is missing')
    const type = req.file.originalname
    const ext = req.file.mimetype == 'image/png' ? 'png' : 'unknown'

    const path = `images/${uuidv4()}.${ext}`
    await writeFile(`${STORAGE_DIRECTORY}/${path}`, req.file.buffer)

    const image = sharp(req.file.buffer)
    const metadata = await image.metadata()
    if (metadata.width == null || metadata.height == null)
      throw new Error('Issue extracting metadata.')

    await prisma.image.create({
      data: {
        path: path,
        type: type,
        leaf_id: leafId,
        height: metadata.height!,
        width: metadata.width!,
      },
    })

    return res.json({ path })
  } catch (err) {
    return res.sendStatus(400)
  }
})




export default routes
