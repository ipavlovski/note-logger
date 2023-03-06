import { PrismaClient, File, Prisma, } from '@prisma/client'
import { DateTime } from 'luxon'

const prisma = new PrismaClient()

interface NestedCategory {
  id: number
  name: string
  icon?: File | null
  order: number
  url: string | null
  parent?: NestedCategory | null
}

interface Category {
  id: number
  name: string
  order: number
  url: string | null
  icon: string | null
}

interface TreeNode {
  category: TreeCategory
  entries: TreeEntry[]
  children: TreeNode[]
  depth: number
}

interface DisplayFlags {
  dates: 'none' | 'day' | 'week' | 'month'
  sort: {
    categories: 'name-asc' | 'name-desc' | 'order'
    entries: 'none' | 'date' | 'name' | 'order'
  }
  shift: { start: number, end: number }
  virtual: { type: 'tag', tags: string[] } | { type: 'none' }
  useUpdated: boolean
}

interface QueryArgs {
  includeArchived: boolean
  tags: string[]
}

type NestedEntries = Prisma.PromiseReturnType<typeof getNestedEntries>
type LinearEntry = Omit<NestedEntries[0], 'category' | 'categoryId'> & {categories: Category[]}
type TreeEntry = LinearEntry & { treePath: Category[] }
type TreeCategory = Category & { treePath: Category[] }


async function getNestedEntries(query: QueryArgs) {
  const { tags } = query

  return prisma.entry.findMany({
    where: tags.length > 0 ? { AND:[
      ... tags.map((tag) => ({ tags: { some: { name: tag } } } ))
    ] } : undefined,
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


async function getLinearizedEntries(nestedEntries: NestedEntries): Promise<LinearEntry[]> {

  return nestedEntries.map((entry) => {
    const acc: Category[] = []
    let nestedCategory: NestedCategory | null = entry.category
    while (nestedCategory != null) {
      acc.push({
        id: nestedCategory.id,
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


function treeformEntries(entry: TreeEntry, treeRoots: TreeNode[]) {
  let roots: TreeNode[] = treeRoots

  for (const [i, category] of entry.treePath.entries()) {
    let match = roots.find((root) => root.category.id == category.id)

    if (! match) {
      const newNode: TreeNode = {
        category: { ...category, treePath: entry.treePath.slice(0, i + 1) },
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
    if (i == entry.treePath.length - 1) {
      match.entries.push(entry)
    }
  }
}


function getVirtualCategory(entry: LinearEntry, spec: DisplayFlags['virtual']): Category[] {
  if (spec.type == 'none') {
    return []
  }

  return []
}

function getDateCategory(date: Date, spec: DisplayFlags['dates']): Category[] {
  // hour offset
  const hours = 5

  let dateTime: DateTime, id: number, name: string
  switch(spec) {
    case 'day':
      dateTime = DateTime.fromJSDate(date).startOf('day').plus({ hours }).startOf('day')
      id = dateTime.toMillis()
      name = `${dateTime.toISODate()} ${dateTime.weekdayLong}`
      return [{ id, name, order: 0, icon: null, url: null }]

    case 'week':
      dateTime = DateTime.fromJSDate(date).startOf('week').plus({ hours }).startOf('day')
      id = dateTime.toMillis()
      name = `${dateTime.toISODate()} W${dateTime.weekNumber}`
      return [{ id, name, order: 0, icon: null, url: null }]

    case 'month':
      dateTime = DateTime.fromJSDate(date).startOf('month').plus({ hours }).startOf('day')
      id = dateTime.toMillis()
      name = `${dateTime.year}-${dateTime.month} ${dateTime.monthLong}`
      return [{ id, name, order: 0, icon: null, url: null }]

    case 'none':
      return []

    default:
      spec satisfies never
      return []
  }

}

function getTreePath(entry: LinearEntry, flags: DisplayFlags): TreeEntry {

  // create a copy of categories, removing 'default' from each
  const treePath = [... entry.categories]
  treePath.shift()

  // shift/unshift
  for (let i = 0; i < flags.shift.start; i++ ) treePath.shift()
  for (let i = 0; i < flags.shift.end; i++ ) treePath.pop()

  // create virtual categories
  const virtual = getVirtualCategory(entry, flags.virtual)
  treePath.unshift(...virtual)

  // add dates
  const date = flags.useUpdated && entry.updatedAt ? entry.updatedAt : entry.createdAt
  treePath.unshift(...getDateCategory(date, flags.dates))

  return { ...entry, treePath }
}


function treeSort(treeRoots: TreeNode[], flags: DisplayFlags) {
  const { sort: { categories: categorySort, entries: entrySort }, useUpdated } = flags


  // sort categories
  switch(categorySort) {
    case 'name-asc':
      treeRoots.sort(({ category: { name: a } }, { category: { name: b } }) => {
        return a == b ? 0 : a > b ? 1 : -1
      })
      break
    case 'name-desc':
      treeRoots.sort(({ category: { name: a } }, { category: { name: b } }) => {
        return a == b ? 0 : a > b ? -1 : 1
      })
      break
    case 'order':
      treeRoots.sort(({ category: { order: a } }, { category: { order: b } }) => a - b)
      break
    default:
      categorySort satisfies never

  }


  // sort entries
  treeRoots.forEach((roots) => {
    const { entries, children } = roots

    switch(entrySort) {
      case 'name':
        entries.sort(({ title: t1 }, { title: t2 }) => {
          const a = t1 ?? '', b = t2 ?? ''
          return a == b ? 0 : a > b ? 1 : -1
        })
        break

      case 'date':
        entries.sort(({ createdAt: c1, updatedAt: u1 }, { createdAt: c2, updatedAt: u2 }) => {
          const a = useUpdated && u1 || c1, b = useUpdated && u2 || c2
          return a.getTime() - b.getTime()
        })
        break

      case 'order':
        entries.sort(({ order: a }, { order: b }) => a - b)
        break

      case 'none':
        break

      default:
        entrySort satisfies never
    }

    // recurse
    if (children.length > 1) treeSort(children, flags)
  })
}


async function queryEntries(query: QueryArgs, flags: DisplayFlags) {
  const outputRoots: TreeNode[] = []

  const nested = await getNestedEntries(query)
  const linear = await getLinearizedEntries(nested)

  // can add .map((v, ind) => ({ ...v, markdown: `Title ${ind+1}` })) to simplify for debugging
  const treePaths = linear.map((v) => getTreePath(v, flags))
  treePaths.forEach((entry) => treeformEntries(entry, outputRoots))
  treeSort(outputRoots, flags)

  return outputRoots
}

export { queryEntries, DisplayFlags, QueryArgs, Category, TreeEntry, TreeNode, TreeCategory }
