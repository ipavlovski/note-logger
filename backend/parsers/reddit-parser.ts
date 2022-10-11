import { extractLightTitle, googleFaviconCache } from 'backend/api/domain-api'
import { getRedditPostData, getSubredditData } from 'backend/api/reddit-api'
import { Parser } from 'backend/routes/node'
import { fetchImageBuffer, saveAsIcon, updateDomainIcon, updateMetadata } from 'backend/util'
import { PrismaClient } from '@prisma/client'
import type { Node } from '@prisma/client'

const prisma = new PrismaClient()

function redditPostMatcher(uri: string) {
  return uri.startsWith('https://www.reddit.com')
}

async function redditPostUpdater(nodeId: number, uri: string) {
  const postData = await getRedditPostData(uri)
  
  const metadata = [
    { key: 'title', type: 'string', value: postData.title },
    { key: 'description', type: 'string', value: postData.description },
    { key: 'created_at', type: 'date', value: postData.createdAt },
  ]
  await updateMetadata(nodeId, metadata)

  const subredditUrl = `https://www.reddit.com/${postData.subreddit}`

  let parent: Node | null
  parent = await prisma.node.findFirst({
    where: { uri: subredditUrl },
  })

  if (!parent) {
    const subredditData = await getSubredditData(`https://www.reddit.com/${postData.subreddit}`)
    parent = await prisma.node.create({
      data: {
        title: subredditData.title,
        uri: subredditUrl,
      },
    })

    if (subredditData.icon != '') {
      const buffer = await fetchImageBuffer(subredditData.icon)
      const iconPath = await saveAsIcon(buffer)
      await prisma.node.update({
        where: { id: nodeId },
        data: { icon: { create: { path: iconPath } } },
      })
    }
  }

  // update the parent
  await prisma.node.update({
    where: { id: nodeId },
    data: { parent: { connect: { id: parent.id } } },
  })

  // update the icon
  const parentWithIcon = await prisma.node.findFirst({
    where: { id: parent.id },
    include: { icon: true },
  })
  await prisma.node.update({
    where: { id: nodeId },
    data: { icon: { connect: { id: parentWithIcon?.icon?.id } } },
  })
}

export const redditPostParser: Parser = {
  name: 'reddit-post-parser',
  matcher: redditPostMatcher,
  updater: redditPostUpdater,
}
