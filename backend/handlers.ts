import { PrismaClient, Category } from '@prisma/client'
import { exec } from 'node:child_process'
import { rename, rm, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'

import { STORAGE_DIRECTORY } from 'backend/config'

const execute = promisify(exec)
const prisma = new PrismaClient()

export async function getQueriedNodes(parentId: number | null, categoryId: number) {
  const results = await prisma.node.findMany({ where: {
    parents: parentId != null ? { some: { id: parentId } } : { none: {} },
    categories: { some: { id: categoryId } },
  } })
  return results
}

export async function getChainNames() {
  return prisma.category.findMany({ where: { parentId: null } })
}


type CategoryWithChild = Category & { child?: CategoryWithChild | null }
type CategoryChain = Array<{ id: number, name: string} | null>
export async function getCategoryChain(name: string) {
  let recursiveMatch: CategoryWithChild = await prisma.category.findFirstOrThrow({
    where: { name, parentId: null },
    include: {
      child: {
        include: {
          child: {
            include: {
              child: true
            }
          }
        }
      }
    }
  })

  const output: CategoryChain = Array.from({ length: 4 })
  for (const ind in output) {
    output[ind] = { id: recursiveMatch.id, name: recursiveMatch.name }
    if (recursiveMatch.child == null) break
    recursiveMatch = recursiveMatch.child
  }
  return output
}

export async function createCategoryChain(name: string) {
  const existingMatch = await prisma.category.findFirst({ where: { name, parentId: null } })
  if (existingMatch != null) throw new Error(`Category chain with name '${name}' already exists.`)

  return prisma.category.create({
    data: { name }
  })
}


async function saveCapturedMedia(src: string, path: 'icons' | 'thumbnails' | 'capture') {
  const basename = `${Date.now()}`
  let filename: string | null = null
  const dir = `${STORAGE_DIRECTORY}/${path}`

  try {
    const base64 = src.replace(/^data:(.*,)?/, '')
    const buffer = Buffer.from(base64, 'base64')
    await writeFile(`${dir}/${basename}.unknown`, buffer)

    const { stdout } = await execute(`file -Lib ${dir}/${basename}.unknown`)
    const [mime] = stdout.split(';', 1)
    console.log(stdout)

    switch (mime) {
      case 'image/png':
        filename = `${basename}.png`
        break
      case 'image/jpeg':
        filename = `${basename}.jpeg`
        break
      case 'video/mp4':
        filename = `${basename}.mp4`
        break
      default:
        console.log('No handler available')
        break
    }
    if (! filename) throw new Error('Failed to get matchign mimes.')
    rename(`${dir}/${basename}.unknown`, `${dir}/${filename}`)

    if (filename.endsWith('.mp4'))
      await execute(`ffmpeg -i ${dir}/${filename} ${dir}/${filename.replace('.mp4', '.gif')}`)

  } catch {
    console.log('Error during file-type identification')
    await rm(`${dir}/${basename}.unknown`, { force: true })
  }

  return filename

}

export async function createNewNode({ parentId, categoryId, name, url, icon, thumbnail }:
{ parentId: number | null, categoryId: number | null, name: string,
  url: string | null, icon: string | null, thumbnail: string | null }) {

  const iconPath = icon && await saveCapturedMedia(icon, 'icons')
  const thumbnailPath = thumbnail && await saveCapturedMedia(thumbnail, 'thumbnails')

  await prisma.node.create({
    data: {
      name,
      categories: categoryId ? { connect: { id: categoryId } } : undefined,
      parents: parentId ? { connect: { id: parentId } } : undefined,
      url: url || undefined,
      icon: iconPath || undefined,
      thumbnail: thumbnailPath || undefined
    }
  })
}
