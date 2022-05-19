import { Prisma, PrismaClient } from '@prisma/client'
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
  if (chain.length == 0 ) return null

  let parent
  for (let name of chain) {
    const obj2: any = { name, parent }
    parent = obj2
  }
  return await prisma.cat.findFirst({ where: parent })
}

export { getCategory }



