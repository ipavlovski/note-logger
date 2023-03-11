import { PrismaClient, File, Prisma, Category } from '@prisma/client'
import { randomUUID as uuidv4 } from 'node:crypto'
import { writeFile, mkdir, rename, rm } from 'node:fs/promises'
import { STORAGE_DIRECTORY } from 'backend/config'
import { setTimeout, } from 'timers/promises'
const prisma = new PrismaClient()

import { promisify } from 'node:util'
import { exec } from 'node:child_process'

const execute = promisify(exec)

export async function getAllTags(tagQuery: string) {
  return await prisma.tag.findMany({
    select: { name: true },
    where: tagQuery == '' ? undefined : { name: { contains: tagQuery } }
  })
}

export async function createNewTag(name: string) {
  return await prisma.tag.create({ data: { name } })
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


/**
 * Get a category from DB.
 * Prepends it with 'default' category, so will always default to that on empty query.
 * With {id:0, name: default}
 * eg: [ 'fireship', '7 Things No Programmer Ever Wants to Hear', 'Vulnerable packages' ]
 */
type NameWithParent = { name: string, parent?: NameWithParent }
async function getCategoryByChain(categoryChain: string[]) {
  const query = ['default', ...categoryChain].map((v) => ({ name: v }))
  return await prisma.category.findFirst({
    where: query.reduce((prev: NameWithParent, curr: NameWithParent) =>
      ({ name: curr.name, parent: prev }))
  })
}

/**
 * Create a category, without checking if it already exists.
 * Will create all preceeding elements if needed.
 * Constrains: length==3 max, not counting 'default' (so technically length==4)
 */
type CategoryProps = { name: string, url?: string, icon?: string }
async function createCategoryByChain(categoryChain: CategoryProps[]) {
  if (categoryChain.length > 3) throw new Error('Category chain exceeds max depth (3)')
  if (categoryChain.length == 0) throw new Error('Must provide at least one category.')

  const createCategory = async (parentId: number, { name, icon, url }: CategoryProps) => {
    return await prisma.category.create({ data: {
      name: name,
      parent: { connect: { id: parentId } },
      url: url,
      icon: icon ?
        { connectOrCreate: { where: { path: icon }, create: { path: icon } } } : undefined
    } })}

  const getOrCreateCategory = async (parentId: number, props: CategoryProps) => {
    return await prisma.category.findFirst({ where: {
      name: props.name, parent: { id: parentId }
    } }) ?? await createCategory(parentId, props)
  }

  let parent: Category, secondParent: Category
  switch (categoryChain.length) {
    case 1:
      return await createCategory(0, categoryChain[0])
    case 2:
      parent = await getOrCreateCategory(0, categoryChain[0])
      return await createCategory(parent.id, categoryChain[1])
    case 3:
      parent = await getOrCreateCategory(0, categoryChain[0])
      secondParent = await getOrCreateCategory(parent.id, categoryChain[1])
      return await createCategory(secondParent.id, categoryChain[2])
    default:
      throw new Error('Unreachable condition.')
  }
}


export async function updateEntryAnnotations(id: number, { tags, category, title }:
{ tags?: string[]; category?: { id: number, name: string }; title?: string }) {

  return await prisma.entry.update({
    where: { id },
    data: {
      title: title,
      tags: tags && { connect: tags.map((name) => ({ name })) },
      category: category && { connect: { id: category.id } }
    },
  })
}
