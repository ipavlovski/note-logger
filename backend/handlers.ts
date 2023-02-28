import { PrismaClient, File, Prisma, } from '@prisma/client'
import { randomUUID as uuidv4 } from 'node:crypto'
import { writeFile, mkdir } from 'node:fs/promises'
import { STORAGE_DIRECTORY } from 'backend/config'
import { setTimeout, } from 'timers/promises'
const prisma = new PrismaClient()


/**
 * INTERFACES
 */


/**
 * QUERY HANDLER
 */


interface NestedCategory {
  id: number
  name: string
  icon?: File | null
  order: number
  url: string | null
  parent?: NestedCategory | null
}

interface Category {
  name: string
  order: number
  url: string | null
  icon: string | null
}

interface TreeNode {
  category: Category
  entries: Entry[]
  children: TreeNode[]
  depth: number
}

type NestedEntries = Prisma.PromiseReturnType<typeof getNestedEntries>
type Entry = Omit<NestedEntries[0], 'category' | 'categoryId'> & {categories: Category[]}


async function getNestedEntries() {
  return prisma.entry.findMany({
    include: {
      category: {
        include: {
          icon: true,
          parent: { include: {
            icon: true,
            parent: { include: {
              icon: true,
              parent: true
            } } } } } },
      tags: true
    }
  })
}


async function getLinearizedEntries(nestedEntries: NestedEntries): Promise<Entry[]> {

  return nestedEntries.map((entry) => {
    const acc: Category[] = []
    let nestedCategory: NestedCategory | null = entry.category
    while (nestedCategory != null) {
      acc.push({
        name: nestedCategory.name,
        icon: nestedCategory.icon?.path || null,
        order: nestedCategory.order,
        url: nestedCategory.url
      })
      nestedCategory = nestedCategory.parent || null
    }

    const { category, categoryId, ...props } = entry
    return {
      ...props,
      categories: acc.reverse()
    }
  })
}


function treeformEntries(entry: Entry, treeRoots: TreeNode[]) {
  let roots: TreeNode[] = treeRoots

  for (const [i, category] of entry.categories.entries()) {
    let match = roots.find((root) => root.category.name == category.name)

    if (! match) {
      const newNode: TreeNode = {
        category,
        entries: [],
        children: [],
        depth: i + 1,
      }
      roots.push(newNode)
      match = newNode
    }

    // use children of the node for the next iteration
    roots = match.children

    // this will be activated at the end of the last index
    // would normally 'break' out of it, but at this point it would be redundant
    if (i == entry.categories.length - 1) {
      match.entries.push(entry)
    }
  }
}

// // TESTING:
// const nested = await getNestedEntries()
// const linear = await getLinearizedEntries(nested)
// const newRoots: TreeNode[] = []
// treeformEntries(linear[0], newRoots)
// console.dir(newRoots, { depth: null })


export async function getEntries(query: string) {
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
