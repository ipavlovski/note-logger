import { STORAGE_DIRECTORY } from 'backend/config'
import { writeFile } from 'fs/promises'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

import { exec } from 'child_process'
import { createWriteStream } from 'fs'
import { stat } from 'fs/promises'
import fetch from 'node-fetch'
import { promisify } from 'util'
import { Prisma, PrismaClient } from '@prisma/client'
import { googleFaviconCache } from 'backend/api/domain-api'

////////////// IMAGE PROCESSING

const prisma = new PrismaClient()


////////////// MANUAL CONVERTER

export const pexec = promisify(exec)

// stream URL file to disk
async function streamFile(url: string, path: string) {
  await fetch(url).then(res => res.body.pipe(createWriteStream(path)))
}

async function manualImageConverter(url: string, path: string) {
  // create temp file name
  var tempFile = `/tmp/note-logger/${uuidv4()}`

  // download the file
  // await pexec(`curl ${url} -s -o ${tempFile}`)
  await streamFile(url, tempFile)

  // identify its mime type
  var fileType = await pexec(`file ${tempFile} -i`).then(v => v.stdout)

  // if the file has a proper mime-type
  if (fileType.includes('image/vnd.microsoft.icon')) {
    await pexec(
      `convert ico:${tempFile} -thumbnail 256x256 -alpha on -background none -flatten ${path}`
    )
  } else {
    console.log('ERROR: no matching mime type for image conversion.')
  }

  // if success, should not throw an error
  await stat(path)
}

////////////// PRISMA

interface Metadata {
  key: string
  type: string
  value: any
}

export async function updateMetadata(nodeId: number, metadata: Metadata[]) {
  for (const data of metadata) {
    try {
      await prisma.node.update({
        where: { id: nodeId },
        data: {
          metadata: {
            // create: { key: data.key, type: data.type, value: data.value },
          },
        },
      })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          console.log('Skipping a duplicate key')
        } else {
          throw e
        }
      }
    }
  }
}

export async function updateDomainIcon(nodeId: number, uri: string) {
  const url = new URL(uri)

  // check for domain in existing entries
  const nodeWithIcon = await prisma.node.findFirst({
    where: { uri: { startsWith: url.origin }, AND: { iconId: { not: null } } },
  })

  if (nodeWithIcon) {
    console.log(`Matching the node with existing icon from node:${nodeWithIcon.id}`)
    // update the data
    await prisma.node.update({
      where: { id: nodeId },
      data: {
        iconId: nodeWithIcon.iconId,
      },
    })
    return
  }

  const iconUrl = await googleFaviconCache(uri)
  console.log(`Downloading icon from ${iconUrl}`)

  const buffer = await fetchImageBuffer(iconUrl)
  const path = await saveAsIcon(buffer)

  await prisma.node.update({
    where: { id: nodeId },
    data: {
      icon: {
        create: {
          path: path,
          source: iconUrl,
        },
      },
    },
  })
}
