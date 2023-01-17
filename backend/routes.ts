import { Prisma, PrismaClient } from '@prisma/client'
import { buildYoutubeUri, extractYoutubeId, handleURI } from 'backend/handlers'
import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { access, writeFile } from 'fs/promises'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { STORAGE_DIRECTORY } from 'backend/config'
import {
  createSuggestedPath,
  getOrCreateImageIcon,
  getSuggestionTree,
  timelineQuery,
} from 'backend/query'

const prisma = new PrismaClient()
const routes = Router()
const storage = multer.memoryStorage()
const upload = multer({ storage: storage, preservePath: true })

const SuggestionPathType = z.enum(['file', 'note'])

routes.get('/paths/:type', async (req, res) => {
  try {
    const type = SuggestionPathType.parse(req.params.type)
    const suggestions = await getSuggestionTree(type)

    return res.json(suggestions)
  } catch (err) {
    console.error(err)
    return res.status(400).json({ error: err instanceof Error ? err.message : 'unknown error' })
  }
})

const SuggestionPathDef = z.object({
  uri: z.string(),
  type: SuggestionPathType,
})

routes.post('/paths/:type', async (req, res) => {
  try {
    const pathDef = SuggestionPathDef.parse(req.body)
    const id = await createSuggestedPath(pathDef)

    return res.json({ id })
  } catch (err) {
    console.error(err)
    return res.status(400).json({ error: err instanceof Error ? err.message : 'unknown error' })
  }
})

routes.post('/note', async (req, res) => {
  try {
  } catch (err) {
    console.error(err)
    return res.status(400).json({ error: err instanceof Error ? err.message : 'unknown error' })
  }
})

const FileUploadInfo = z.object({
  uriPath: z.string(),
  fileTitle: z.string(),
  filename: z.string(),
  metadata: z.object({
    lastModified: z.string(),
    fileSize: z.number(),
  }),
})

routes.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (req.file == null) throw new Error('Attached file is missing')
    const info = FileUploadInfo.parse(JSON.parse(decodeURI(req.file.originalname)))
    console.log(info)

    // ensure the file is correct (maybe check it size?)
    // req.file.buffer

    // validate the filename
    info.filename

    // validte uriPath -> check that parent exists
    info.uriPath

    // validate file title -> needs to be of certain length
    info.fileTitle

    // prep the paths
    const path = `files/${info.filename}`
    const dest = `${STORAGE_DIRECTORY}/${path}`

    // throw error if file with same name already exsists
    // await access(dest)
    await writeFile(dest, req.file.buffer)

    // prep the icon
    const icon = await getOrCreateImageIcon('book')

    // create the entry
    const node = await prisma.node.create({
      data: {
        title: info.fileTitle,
        uri: `file://${info.uriPath}/${info.filename}`,
        icon: { connect: { id: icon.id } },
        parent: { connect: { uri: `file://${info.uriPath}` } },
        metadata: JSON.stringify(info.metadata)
      },
    })

    return res.sendStatus(201)
  } catch (err) {
    console.error(err)
    return res.status(400).json({ error: err instanceof Error ? err.message : 'unknown error' })
  }
})

const FilePageArgs = z.object({
  title: z.string(),
  page: z.number(),
})

routes.post('/file/:id', async (req, res) => {
  try {
    const parent = await prisma.node.findFirstOrThrow({ where: { id: parseInt(req.params.id) } })
    const props = FilePageArgs.parse(req.body)
    const uri = `${parent.uri}[${props.page}]`

    const results = await prisma.node.create({
      data: {
        parent: { connect: { id: parent.id } },
        title: props.title,
        uri,
        icon: { connect: { id: parent.iconId! } },
      },
    })

    return res.json(results)
  } catch (err) {
    console.error(err)
    return res.status(400).json({ error: err instanceof Error ? err.message : 'unknown error' })
  }
})

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
    const uri: string = req.body.uri
    console.log(`the uri: ${uri}`)

    // check if a node already exists
    const existingNode = await prisma.node.findFirst({ where: { uri: uri } })
    if (existingNode != null) throw new Error('Node with URI already exists')

    const result = await handleURI(uri)
    if (!result) throw new Error('Failed to create a node!')

    console.log(`Success creating a node with id: ${result.id}`)
    return res.json({ success: `created a node with URI id: ${result.id}` })
  } catch (err) {
    console.error(err)
    return res.json({ error: err instanceof Error ? err.message : 'unknown error' })
  }
})

const UriYoutubeArgs = z.object({
  timestamp: z.number(),
  title: z.string(),
})

routes.post('/uri/:id', async (req, res) => {
  try {
    const parent = await prisma.node.findFirstOrThrow({ where: { id: parseInt(req.params.id) } })
    const props = UriYoutubeArgs.parse(req.body)
    const uri = `${parent.uri}[${props.timestamp}]`

    const results = await prisma.node.create({
      data: {
        parent: { connect: { id: parent.id } },
        title: props.title,
        uri,
        icon: { connect: { id: parent.iconId! } },
      },
    })

    return res.json(results)
  } catch (err) {
    console.error(err)
    return res.status(400).json({ error: err instanceof Error ? err.message : 'unknown error' })
  }
})

const nodeWithIcon = Prisma.validator<Prisma.NodeArgs>()({
  include: { icon: true },
})

export type NodeWithIcon = Prisma.NodeGetPayload<typeof nodeWithIcon>

// routes.post('/history', async (req, res) => {
//   const results = await prisma.node.findMany({ include: { icon: true } })
//   return res.json(results)
// })

// var props: TimelineQuery = {
//   endDate: new Date(),
//   range: 'week',
//   split: 'day',
//   virtualNodes: false,
//   includeArchived: false,
// }

const TimelineProps = z.object({
  endDate: z.coerce.date(),
  range: z.enum(['day', 'week', 'month']),
  split: z.enum(['day', 'week', 'month']),
  virtualNodes: z.boolean(),
  includeArchived: z.boolean(),
})

// extract the inferred type
export type TimelineProps = z.infer<typeof TimelineProps>

routes.post('/timeline', async (req, res) => {
  try {
    const props = TimelineProps.parse(req.body)
    // const props: TimelineQuery = req.body
    const results = await timelineQuery(props)

    return res.json(results)
  } catch (err) {
    console.error(err)
    return res.json({ error: err instanceof Error ? err.message : 'unknown error' })
  }
})

const nodeWithProps = Prisma.validator<Prisma.NodeArgs>()({
  include: {
    leafs: { include: { images: true } },
    icon: true,
    preview: true,
    tags: true,
    properties: true,
    category: true,
  },
})

const nodeWithChildren = Prisma.validator<Prisma.NodeArgs>()({
  include: {
    children: true,
  },
})

export type NodeWithProps = Prisma.NodeGetPayload<typeof nodeWithProps>
export type NodeWithChildren = Prisma.NodeGetPayload<typeof nodeWithChildren>
export type NodeWithSiblings = NodeWithProps & { siblings: NodeWithChildren }
routes.get('/node/:id', async (req, res) => {
  try {
    const nodeMatch: NodeWithProps = await prisma.node.findFirstOrThrow({
      where: { id: parseInt(req.params.id) },
      include: {
        leafs: { include: { images: true } },
        icon: true,
        preview: true,
        tags: true,
        properties: true,
        category: true,
      },
    })

    if (nodeMatch.uri.startsWith('https://www.youtube.com/watch')) {
      const youtubeId = extractYoutubeId(nodeMatch.uri)

      const siblings: NodeWithChildren = await prisma.node.findFirstOrThrow({
        where: { uri: buildYoutubeUri(youtubeId) },
        include: {
          children: true,
        },
      })

      return res.json({ ...nodeMatch, siblings })
    }

    // if (nodeMatch.uri.startsWith('pdf://')) {

    // }

    return res.json({ ...nodeMatch, siblings: [] })
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
