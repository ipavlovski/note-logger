import { STORAGE_DIRECTORY, YOUTUBE_API_KEY } from 'backend/config'
import fetch from 'node-fetch'
import { PrismaClient } from '@prisma/client'
import { fetchImageBuffer, saveAsIcon, saveAsPreview } from 'backend/util'
import { Parser } from 'backend/routes/node'

const prisma = new PrismaClient()

const base = 'https://youtube.googleapis.com/youtube/v3'

////////////// YOUTUBE CHANNEL: MATCHER, FETCHER, INSERTER

// matcher
const youtubeChannelMatcher = (uri: string) => {
  const matches = [...uri.matchAll(/(.*)(www.youtube.com\/channel\/)(.*)/g)]
  return matches.length > 0 ? matches[0][3] : null
}

// fetcher
const youtubeChannelFetcher = async (channelId: string) => {
  const channelData = await fetch(
    `${base}/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
  ).then(v => v.json())

  if (!channelData) return null

  const title = channelData.items[0].snippet.customUrl as string
  const description = channelData.items[0].snippet.description as string
  const created = channelData.items[0].snippet.publishedAt as string
  const icon = channelData.items[0].snippet.thumbnails.default.url

  return { title, description, created, icon } as YoutubeChannelData
}

const youtubeChannelUpdater = async (nodeId: number, channelData: YoutubeChannelData) => {
  const buffer = await fetchImageBuffer(channelData.icon)
  const path = await saveAsIcon(buffer)

  // update the data
  await prisma.node.update({
    where: { id: nodeId },
    data: {
      metadata: {
        create: [
          { key: 'title', type: 'string', value: channelData.title },
          { key: 'description', type: 'string', value: channelData.description },
          { key: 'created', type: 'date', value: channelData.created },
        ],
      },
      icon: {
        create: {
          path: path,
          source: channelData.icon,
        },
      },
    },
  })
}

export type YoutubeChannelData = {
  description: string
  title: string
  created: string
  icon: string
}
export const youtubeChannelParser: Parser<YoutubeChannelData> = {
  matcher: youtubeChannelMatcher,
  fetcher: youtubeChannelFetcher,
  updater: youtubeChannelUpdater,
}
