import { Prisma, PrismaClient } from '@prisma/client'
import type { Node, Icon } from '@prisma/client'
import { DateTime } from 'luxon'
import { TimelineProps } from 'backend/routes'
import { access, copyFile } from 'fs/promises'
import { STORAGE_DIRECTORY } from 'backend/config'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

type TimeSplit = TimelineProps['split']

type NodeWithParent = Node & { parent: Node | null; icon: Icon | null }

type NodeWithIcon = Node & { icon: Icon | null }

export interface TreeBranch {
  item: NodeWithIcon | { title: string; uri: string }
  depth: number
  children: TreeBranch[]
}

function getDateRange(endDate: Date, range: TimeSplit, dayStartHour = 5) {
  const endDateTime = DateTime.fromJSDate(endDate)

  // TODO: OVERRIDE DAYS, JUST FOR NOW ({ days: 7}) is the default
  const startDateTime =
    range == 'day'
      ? endDateTime.minus({ hours: 23 }).startOf('day').plus({ hours: dayStartHour })
      : range == 'week'
      ? endDateTime.minus({ days: 21 }).startOf('week').plus({ hours: dayStartHour })
      : endDateTime.minus({ month: 1 }).startOf('month').plus({ hours: dayStartHour })

  return startDateTime.toJSDate()
}

function getDateSplits(start: Date, end: Date, split: TimeSplit) {
  let startBracket = DateTime.fromJSDate(start)
  let endBracket: DateTime
  const acc: { start: Date; end: Date }[] = []

  do {
    endBracket =
      split == 'day'
        ? startBracket.plus({ days: 1 })
        : split == 'week'
        ? startBracket.plus({ week: 1 })
        : startBracket.plus({ month: 1 })
    acc.push({ start: startBracket.toJSDate(), end: endBracket.toJSDate() })
    startBracket = endBracket
  } while (endBracket <= DateTime.fromJSDate(end))

  return acc
}

function linearizeItem(nodeWithParents: NodeWithParent, acc: NodeWithIcon[]) {
  let { parent, ...node } = nodeWithParents
  acc.push(node)
  if (parent != null) linearizeItem(parent as NodeWithParent, acc)
}

async function getMatches(start: Date, end: Date, includeArchived: boolean) {
  const nodeMatches = await prisma.node.findMany({
    where: {
      createdAt: { gte: start, lt: end },
    },
    include: {
      icon: true,
      parent: { include: { icon: true, parent: { include: { icon: true, parent: true } } } },
    },
  })

  const leafMatches = await prisma.node.findMany({
    where: {
      leafs: { some: { createdAt: { gte: start, lt: end }, archived: includeArchived } },
    },
    include: {
      icon: true,
      parent: { include: { icon: true, parent: { include: { icon: true, parent: true } } } },
    },
  })

  // TODO: join by URI (remove duplicates - eg. days when both created nodes and leafs)
  return [...nodeMatches, ...leafMatches]
}

function appendVirtualTreeNodes(treeRoots: TreeBranch[]) {
  const newTreeRoots: TreeBranch[] = []

  const getOrCreateVirtualNode = (nodeName: string): TreeBranch[] => {
    const virtualRoot = newTreeRoots.find(treeNode => treeNode.item.uri == `virtual://${nodeName}`)

    if (!virtualRoot) {
      const newNode: TreeBranch = {
        item: { title: nodeName, uri: `virtual://${nodeName}` },
        depth: 0,
        children: [],
      }
      newTreeRoots.push(newNode)
      return newNode.children
    } else {
      return virtualRoot.children
    }
  }

  treeRoots.forEach(treeRoot => {
    if (treeRoot.item.uri.startsWith('https://www.youtube.com')) {
      getOrCreateVirtualNode('youtube').push(treeRoot)
    } else if (treeRoot.item.uri.startsWith('note://')) {
      getOrCreateVirtualNode('note').push(treeRoot)
    } else if (treeRoot.item.uri.startsWith('file://')) {
      getOrCreateVirtualNode('file').push(treeRoot)
    } else {
      getOrCreateVirtualNode('web').push(treeRoot)
    }
  })

  return newTreeRoots
}

// virtual ind: add 1 to all the inds, since they will be prefixed with virtual ind
// virtual ind will have ind=0 in this case, otherwise will not have an ind value for virt-ind
function getTreeFromLineup(lineups: NodeWithIcon[][], virtualNodes: boolean) {
  const treeRoots: TreeBranch[] = []
  lineups.map(lineup => {
    lineup.reduce((acc, val, ind) => {
      // find an existing match
      const treeNodeMatch = acc.find(treeNode => treeNode.item.uri == val.uri)

      // if doesn't exist, create it, and return its children
      // otherwise return existing children
      if (!treeNodeMatch) {
        const newNode: TreeBranch = {
          item: val,
          depth: virtualNodes ? ind + 1 : ind,
          children: [],
        }
        acc.push(newNode)
        return newNode.children
      } else {
        return treeNodeMatch.children
      }
    }, treeRoots)
  })

  return virtualNodes ? appendVirtualTreeNodes(treeRoots) : treeRoots
}

export interface TimelineNode {
  startDate: string
  treeRoots: TreeBranch[]
}

export async function timelineQuery(props: TimelineProps): Promise<TimelineNode[]> {
  const startDate = getDateRange(props.endDate, props.range)
  const dateSplits = getDateSplits(startDate, props.endDate, props.split)

  const results: TimelineNode[] = []
  for (const dateSplit of dateSplits) {
    const matches = await getMatches(dateSplit.start, dateSplit.end, props.includeArchived)
    if (matches.length == 0) continue
    const lineups = matches.map(match => {
      var acc: NodeWithIcon[] = []
      linearizeItem(match, acc)
      return acc.reverse()
    })
    const treeRoots = getTreeFromLineup(lineups, props.virtualNodes)

    results.push({ startDate: dateSplit.start.toISOString(), treeRoots: treeRoots })
  }
  results.sort((v1, v2) => new Date(v2.startDate).valueOf() - new Date(v1.startDate).valueOf())

  return results
}

export async function getOrCreateImageIcon(iconName: string) {
  // get the source, throw error if doesnt exist
  const source = `node_modules/@tabler/icons/icons-png/${iconName}.png`

  // check for an existing icon
  const existingIcon = await prisma.icon.findFirst({ where: { source: { equals: source } } })
  if (existingIcon) return existingIcon

  // check source exists, copy the file to destination
  await access(source)
  const path = `icons/${uuidv4()}.png`
  await copyFile(source, `${STORAGE_DIRECTORY}/${path}`)

  // create the icon
  const newIcon = await prisma.icon.create({ data: { path, source } })
  return newIcon
}

export async function getSuggestionTree(type: 'file' | 'note') {
  if (type != 'file' && type != 'note') throw new Error('Wrong type input for suggestion tree.')

  // IMPORTANT: 'folders' need to carry metadata of { type: "folder" }
  // this is true for both note:// and file:// URIs
  const results = await prisma.node.findMany({
    where: {
      uri: { startsWith: `${type}://`, not: { endsWith: `${type == 'file' ? '.pdf' : '.note'}` } },
    },
    select: { uri: true, title: true },
  })

  const suggestionTree = results.map(({ uri }) => {
    var uriPath = uri.split(`${type}://`)[1]

    return {
      value: uriPath,
      group: uriPath.split('/')[0],
    }
  })

  return suggestionTree
}

// will return ID of the newly created path on success (throw errors on failure)
export async function createSuggestedPath({ type, uri }: { type: 'file' | 'note'; uri: string }) {
  // must adhere to the proper path uri (file:// or note://, which will be built in the end)
  if (type != 'file' && type != 'note') throw new Error('Wrong type input for suggested path.')

  // check that path only contains lowercase alphanumerics + dash/underscore
  const regex = /^[a-z\d-_\/]+$/
  if (!regex.test(uri)) throw new Error('URI path can only have [a-z0-9_-] chracters')

  // split by '/', remove any empty elements (duplicate '/'s)
  // ensure that the 'depth' of the path doesn't exceed 3 (which is max-depth)
  const splitPath = uri.split('/').filter(str => str != '')
  if (splitPath.length > 3) throw new Error('URI path can have max-depth of 3 folders')
  if (splitPath.length == 0) throw new Error('URI path must include at least one folder')

  // get the initial 'seed' node
  let lastId: number | undefined
  for (let i = 1; i <= splitPath.length; i++) {
    const match = await prisma.node.findFirst({
      where: { uri: `${type}://${splitPath.slice(0, i).join('/')}` },
      select: { id: true },
    })

    if (match) {
      lastId = match.id
      continue
    }

    const icon = await getOrCreateImageIcon('notes')
    const { id: newId } = await prisma.node.create({
      data: {
        title: splitPath[i - 1],
        uri: `${type}://${splitPath.slice(0, i).join('/')}`,
        parent: lastId ? { connect: { id: lastId } } : undefined,
        icon: { connect: { id: icon.id } },
      },
      select: { id: true },
    })
    lastId = newId
  }

  return lastId!
}
