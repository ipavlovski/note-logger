import { PrismaClient, File, Prisma, } from '@prisma/client'
import { randomUUID as uuidv4 } from 'node:crypto'
import { writeFile, mkdir } from 'node:fs/promises'
import { STORAGE_DIRECTORY } from 'backend/config'
import { setTimeout, } from 'timers/promises'
import { queryEntries } from 'backend/query'
const prisma = new PrismaClient()


/**
 * INTERFACES
 */


export async function getEntries(query: string) {
  // await queryEntries()
  return await prisma.entry.findMany()
}


/**
 * OTHER STUFF
 */


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
