import { PrismaClient } from '@prisma/client'

import { fetchImageBuffer, saveAsIcon, saveAsPreview, updateMetadata } from 'backend/util'
import { Parser } from 'backend/routes/node'
import { fetchChannelData, fetchVideoData } from 'backend/api/youtube-api'

const prisma = new PrismaClient()

////////////// YOUTUBE CHANNEL: MATCHER, FETCHER, INSERTER

const channelMatcher = (uri: string) => {
  const matches = [...uri.matchAll(/(.*)(www.youtube.com\/channel\/)(.*)/g)]
  return matches.length > 0
}

const channelUpdater = async (nodeId: number, uri: string) => {
  const matches = [...uri.matchAll(/(.*)(www.youtube.com\/channel\/)(.*)/g)]
  const channelId = matches[0][3]

  const channelData = await fetchChannelData(channelId)

  const buffer = await fetchImageBuffer(channelData.icon)
  const path = await saveAsIcon(buffer)

  // update the data
  const metadata = [
    { key: 'title', type: 'string', value: channelData.title },
    { key: 'description', type: 'string', value: channelData.description },
    { key: 'created', type: 'date', value: channelData.created },
  ]
  await updateMetadata(nodeId, metadata)

  // update icon
  await prisma.node.update({
    where: { id: nodeId },
    data: {
      icon: {
        create: {
          path: path,
          source: channelData.icon,
        },
      },
    },
  })
}

export const youtubeChannelParser: Parser = {
  name: 'youtube-channel-parser',
  matcher: channelMatcher,
  updater: channelUpdater,
}

////////////// YOUTUBE VIDEO: MATCHER, FETCHER, INSERTER

// matcher
const videoMatcher = (uri: string) => {
  const matches = [...uri.matchAll(/(.*)(www.youtube.com\/watch\?v=)(.*)/g)]
  return matches.length > 0
}

const videoUpdater = async (nodeId: number, uri: string) => {
  const matches = [...uri.matchAll(/(.*)(www.youtube.com\/watch\?v=)(.*)/g)]
  const videoId = matches[0][3]
  const videoData = await fetchVideoData(videoId)

  // save full-res image as preview
  const buffer = await fetchImageBuffer(videoData.thumbnail)
  const iconPath = await saveAsIcon(buffer)
  const previewPath = await saveAsPreview(buffer)

  const metadata = [
    { key: 'title', type: 'string', value: videoData.title },
    { key: 'description', type: 'string', value: videoData.description },
    { key: 'published', type: 'date', value: videoData.published },
  ]
  await updateMetadata(nodeId, metadata)

  // update the data
  await prisma.node.update({
    where: { id: nodeId },
    data: {
      icon: {
        create: {
          path: iconPath,
          source: videoData.thumbnail,
        },
      },
      preview: {
        create: {
          path: previewPath,
          source: videoData.thumbnail,
        },
      },
    },
  })
}

export const youtubeVideoParser: Parser = {
  name: 'youtube-video-parser',
  matcher: videoMatcher,
  updater: videoUpdater,
}
