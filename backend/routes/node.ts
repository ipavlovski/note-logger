import { Prisma, PrismaClient } from '@prisma/client'
import { LeafWithImages } from 'backend/routes/leaf'
import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { writeFile } from 'fs/promises'
import sharp from 'sharp'
import { STORAGE_DIRECTORY } from 'backend/config'
import multer from 'multer'
import { youtubeVideoParser, youtubeChannelParser } from 'backend/parsers/youtube-parser'
import { domainParser } from 'backend/parsers/domain-parser'
import { redditPostParser } from 'backend/parsers/reddit-parser'
import { seCommonParser, seUncommonParser } from 'backend/parsers/se-parser'

const prisma = new PrismaClient()
const routes = Router()

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const nodeWithProps = Prisma.validator<Prisma.NodeArgs>()({
  include: {
    parent: true,
    children: true,
    leafs: { include: { images: true } },
    // history: true,
    icon: true,
    preview: true,
    // metadata: true,
    tags: true,
  },
})
export type NodeWithProps = Prisma.NodeGetPayload<typeof nodeWithProps>

routes.get('/node/:id', async (req, res) => {
  const results: NodeWithProps | null = await prisma.node.findFirst({
    where: { id: parseInt(req.params.id) },
    include: {
      parent: true,
      children: true,
      leafs: { include: { images: true } },
      // history: true,
      icon: true,
      preview: true,
      // metadata: true,
      tags: true,
    },
  })
  return res.json(results)
})

export interface Parser {
  name: string
  matcher: (uri: string) => boolean
  updater: (nodeId: number, uri: string) => Promise<void>
}

routes.get('/node/:id/parse', async (req, res) => {
  const nodeId = parseInt(req.params.id)

  try {
    const node = await prisma.node.findFirstOrThrow({ where: { id: nodeId } })

    const parsers: Parser[] = [
      youtubeVideoParser,
      youtubeChannelParser,
      seCommonParser,
      seUncommonParser,
      redditPostParser,
      domainParser,
    ]

    for (const parser of parsers) {
      const match = parser.matcher(node.uri)
      if (!match) continue

      console.log(`Using ${parser.name} to parse data`)
      await parser.updater(nodeId, node.uri)
      break
    }

    return res.json({ message: 'success' })
  } catch (err) {
    console.error(err)
    return res.json({ error: err instanceof Error ? err.message : 'unknown error' })
  }
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

export default routes
