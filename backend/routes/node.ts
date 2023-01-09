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

export default routes
