import { Prisma, PrismaClient } from '@prisma/client'
import { STORAGE_DIRECTORY } from 'backend/config'
import { handleURI } from 'backend/handlers'
import {
  createSuggestedPath,
  getOrCreateImageIcon,
  getSuggestionTree,
  timelineQuery
} from 'backend/query'
import { Router } from 'express'
import { writeFile } from 'fs/promises'
import multer from 'multer'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

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
    await prisma.node.create({
      data: {
        title: info.fileTitle,
        uri: `file://${info.uriPath}/${info.filename}`,
        icon: { connect: { id: icon.id } },
        parent: { connect: { uri: `file://${info.uriPath}` } },
        metadata: JSON.stringify(info.metadata),
      },
    })

    return res.sendStatus(201)
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

const UriPageOrTimestamp = z.union([
  z.object({
    title: z.string(),
    timestamp: z.number(),
  }),
  z.object({
    title: z.string(),
    page: z.number(),
  }),
])

routes.post('/uri/:id', async (req, res) => {
  try {
    const props = UriPageOrTimestamp.parse(req.body)
    const parent = await prisma.node.findFirstOrThrow({ where: { id: parseInt(req.params.id) } })

    // declare URI and ICON -> feel free to override icon in if-handlers
    let uri = ''
    let iconId = parent.iconId!

    // handle youtube
    if ('timestamp' in props) {
      uri = `${parent.uri}&ms=${props.timestamp}`
    }

    // handle pdf case
    if ('page' in props) {
      uri = `${parent.uri}?pg=${props.page}`
    }
    
    // if failed to set URI, throw an error
    if (uri == '') throw new Error('Failed to set URI')

    // 
    const results = await prisma.node.create({
      data: {
        parent: { connect: { id: parent.id } },
        title: props.title,
        uri,
        icon: { connect: { id: iconId! } },
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

////////////// GET /NODE/:ID
// get node by id
// use custom handlers to populate 'siblings' property
// depending

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

const siblingNodes = Prisma.validator<Prisma.NodeArgs>()({
  select: {
    id: true,
    uri: true,
    title: true,
    preview: true,
    children: {
      select: {
        id: true,
        uri: true,
        title: true,
        preview: true,
      },
    },
  },
})

export type NodeWithProps = Prisma.NodeGetPayload<typeof nodeWithProps>
export type SiblingNodes = Prisma.NodeGetPayload<typeof siblingNodes>
export type NodeWithSiblings = NodeWithProps & { siblings: SiblingNodes }
export type ChildNode = NodeWithSiblings['siblings']['children'][0]

async function getNodeWithSiblings(
  nodeMatch: NodeWithProps,
  parentUri: string
): Promise<NodeWithSiblings> {
  const siblings: SiblingNodes = await prisma.node.findFirstOrThrow({
    where: { uri: parentUri },
    select: {
      id: true,
      uri: true,
      title: true,
      preview: true,
      children: {
        select: {
          id: true,
          uri: true,
          title: true,
          preview: true,
        },
      },
    },
  })

  return { ...nodeMatch, siblings }
}

routes.get('/node/:id', async (req, res) => {
  try {
    // first, get the main node with all the leafs and metadata
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

    // if it's a youtube node, get siblings also
    if (nodeMatch.uri.startsWith('https://www.youtube.com/watch')) {
      const videoId = new URL(nodeMatch.uri).searchParams.get('v')!
      const parentURI = `https://www.youtube.com/watch?v=${videoId}`
      const nodeWithSiblings = await getNodeWithSiblings(nodeMatch, parentURI)
      return res.json(nodeWithSiblings)
    }

    // if it's a file node, get siblings also
    if (nodeMatch.uri.startsWith('file://') && nodeMatch.uri.includes('.pdf')) {
      const parentURI = nodeMatch.uri.split('?')[0]
      const nodeWithSiblings = await getNodeWithSiblings(nodeMatch, parentURI)
      return res.json(nodeWithSiblings)
    }

    // for all other nodes, send the node without siblings
    return res.json(nodeMatch)
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
