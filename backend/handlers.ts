import { PrismaClient, File, Prisma, } from '@prisma/client'
import { randomUUID as uuidv4 } from 'node:crypto'
import { writeFile, mkdir, rename, rm } from 'node:fs/promises'
import { STORAGE_DIRECTORY } from 'backend/config'
import { setTimeout, } from 'timers/promises'
const prisma = new PrismaClient()

import { promisify } from 'node:util'
import { exec } from 'node:child_process'

const execute = promisify(exec)

export async function getAllTags() {
  return await prisma.tag.findMany({ select: { name: true } })
}

export async function createNewTag(name: string) {
  await prisma.tag.create({ data: { name } })
}

export async function updateTagName({ newName, oldName }: { oldName: string; newName: string }) {
  await prisma.tag.update({ where: { name: oldName }, data: { name: newName } })
}

export async function deleteTag(name: string) {
  await prisma.tag.delete({ where: { name } })
}

export async function createOrUpdateEntry({ id, markdown }: {id: number | null, markdown: string}) {
  return id == null ?
    await prisma.entry.create({
      data: { markdown }
    }) :
    await prisma.entry.update({
      where: { id }, data: { markdown }
    })

}

export async function uploadBase64File({ base64 }: {base64: string}) {
  const basename = `${Date.now()}`
  let filename: string | null = null

  try {
    const buffer = Buffer.from(base64, 'base64')
    await writeFile(`${STORAGE_DIRECTORY}/${basename}.unknown`, buffer)

    const { stdout } = await execute(`file -Lib ${STORAGE_DIRECTORY}/${basename}.unknown`)
    const [mime] = stdout.split(';', 1)

    switch (mime) {
      case 'image/png':
        filename = `${basename}.png`
        break
      case 'video/mp4':
        filename = `${basename}.mp4`
        break
      default:
        console.log('No handler available')
        break
    }
    if (! filename) throw new Error('Failed to get matchign mimes.')
    rename(`${STORAGE_DIRECTORY}/${basename}.unknown`, `${STORAGE_DIRECTORY}/${filename}`)

  } catch {
    console.log('Error during file-type identification')
    await rm(`${STORAGE_DIRECTORY}/${basename}.unknown`, { force: true })
  }

  return { filename }

}