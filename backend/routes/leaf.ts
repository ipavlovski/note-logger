import { Prisma, PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { DateTime } from 'luxon'
import sharp from 'sharp'

import { writeFile } from 'fs/promises'

import { z } from 'zod'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { STORAGE_DIRECTORY } from 'backend/config'

const prisma = new PrismaClient()

const leafWithMedia = Prisma.validator<Prisma.LeafArgs>()({
  include: {
    media: true,
  },
})
export type LeafWithMedia = Prisma.LeafGetPayload<typeof leafWithMedia>

const routes = Router()
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

routes.post('/leaf/:id/update', async (req, res) => {
  var leafId = parseInt(req.params.id)
  var content = req.body.content

  await prisma.leaf.update({ where: { id: leafId }, data: { content: content } })
  return res.json({ success: 1 })
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

    return res.json({ path: path })
  } catch (err) {
    return res.sendStatus(400)
  }
})

export default routes
