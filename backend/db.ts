import { Prisma, PrismaClient } from '@prisma/client'
import { STORAGE_DIRECTORY } from 'common/config'
import fetch from 'node-fetch'
import sharp from 'sharp'
import { nanoid } from 'nanoid'
import { YoutubeChannel } from 'backend/handlers/youtube'

const prisma = new PrismaClient()

type CatChain = Prisma.PromiseReturnType<typeof getCatChain>

////////////// FLATTEN CATS

async function getCatChain() {
  return await prisma.cat.findFirst({
    // level 1
    select: {
      id: true,
      name: true,
      parent: {
        // level 2
        select: {
          id: true,
          name: true,
          parent: {
            // level 3
            select: {
              id: true,
              name: true,
              parent: {
                // level 4
                select: {
                  id: true,
                  name: true,
                  parent: {
                    // level 5
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
}

async function getAllChains(): Promise<CatChain[]> {
  return await prisma.cat.findMany({
    // level 1
    select: {
      id: true,
      name: true,
      parent: {
        // level 2
        select: {
          id: true,
          name: true,
          parent: {
            // level 3
            select: {
              id: true,
              name: true,
              parent: {
                // level 4
                select: {
                  id: true,
                  name: true,
                  parent: {
                    // level 5
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
}

// var chains = await getAllChains()
// flattenCats(chains[12])
function flattenCats(inputChain: CatChain) {
  const acc: { id: number; name: string }[] = []
  let chain: CatChain
  chain = inputChain
  for (let ind = 1; ind <= 5; ind++) {
    acc.push({ id: chain!.id, name: chain!.name })
    if (chain?.parent) {
      chain = chain?.parent! as CatChain
    } else {
      break
    }
  }
  return acc.reverse()
}

async function getCategory(chain: string[]) {
  if (chain.length == 0) return null

  let parent
  for (let name of chain) {
    const obj2: any = { name, parent }
    parent = obj2
  }
  return await prisma.cat.findFirst({ where: parent })
}

async function downloadImage(url: string, path: string) {
  const res = await fetch(url)
  var buff = Buffer.from(await res.arrayBuffer())
  await sharp(buff).resize(200, 200).webp().toFile(path)
}

async function saveIcon(url: string) {
  var path = `${STORAGE_DIRECTORY}/icons/${nanoid(14)}.webp`
  await downloadImage(url, path)

  return await prisma.icon.create({
    data: {
      path: path,
      source: url,
    },
  })
}

async function saveImage() {}



async function insertYoutubeChannelNode(channel: YoutubeChannel) {

  // get the id for the 'channel' category
  const channelCategory = await getCategory(['youtube', 'channel'])
  if (!channelCategory) throw new Error('Failed to find the channel category in DB.')

  // download the icon
  channel.icon

  // create the channel entry
  return await prisma.node.create({
    data: {
      title: channel.title,
      uri: channel.id,
      category: { connect: { id: channelCategory!.id } },
      icon: { create: { path: 'asdf' } },
      meta: {
        create: [{ key: 'description', value: channel.desc, type: 'text' }],
      },
      leafs: {
        create: [{ type: 'meta', content: '' }],
      },
    },
  })
}






export { getCategory, saveIcon, insertYoutubeChannelNode }
