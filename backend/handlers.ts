import { PrismaClient, Category } from '@prisma/client'
import { DateTime } from 'luxon'

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

export async function createNewNode({ parentId, categoryId, name }:
{ parentId: number | null; categoryId: number | null; name: string }) {
  await prisma.node.create({
    data: {
      name,
      categories: categoryId ? { connect: { id: categoryId } } : undefined,
      parents: parentId ? { connect: { id: parentId } } : undefined
    }
  })
}
