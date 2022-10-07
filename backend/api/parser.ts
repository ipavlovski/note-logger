import {  STORAGE_DIRECTORY, YOUTUBE_API_KEY } from 'backend/config'
import fetch from 'node-fetch'
import { PrismaClient } from '@prisma/client'
import { writeFile } from 'fs/promises'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
const prisma = new PrismaClient()

const base = 'https://youtube.googleapis.com/youtube/v3'



////////////// UTILS

const saveImage = async (url: string, subdir: string) => {
    // get the image
    const imageData = await fetch(url).then((v) => v.arrayBuffer())

    // create the buffer+sharp objects from the image data
    const buffer = Buffer.from(imageData)
    const sharpImage = sharp(buffer)
  
    // get the image format
    const { format } = await sharpImage.metadata()
  
    // get the path, and write file to buffer
    const path = `${subdir}/${uuidv4()}.${format}`
    await writeFile(`${STORAGE_DIRECTORY}/${path}`, buffer)

    return path
}


////////////// YOUTUBE CHANNEL: MATCHER, FETCHER, INSERTER

// matcher
const youtubeChannelMatcher = (uri: string) => {
  const matches = [...uri.matchAll(/(.*)(www.youtube.com\/channel\/)(.*)/g)]
  return matches.length > 0 ? matches[0][3] : null
}

// fetcher
type YoutubeChannelData = { description: string; title: string; created: string; icon: string }
const youtubeChannelFetcher = async (channelId: string) => {
  const channelData = await fetch(
    `${base}/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
  ).then((v) => v.json())

  if (!channelData) return null

  const title = channelData.items[0].snippet.customUrl as string
  const description = channelData.items[0].snippet.description as string
  const created = channelData.items[0].snippet.publishedAt as string
  const icon = channelData.items[0].snippet.thumbnails.default.url

  return { title, description, created, icon } as YoutubeChannelData
}

const youtubeChannelUpdater = async (nodeId: number, channelData: YoutubeChannelData) => {

  const path = await saveImage(channelData.icon, 'icons')

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


const youtubeChannel = {
  matcher: youtubeChannelMatcher,
  fetcher: youtubeChannelFetcher,
  updater: youtubeChannelUpdater
}


////////////// YOUTUBE VIDEO: MATCHER, FETCHER, INSERTER

// matcher
const youtubeVideoMatcher = (uri: string) => {
  const matches = [...uri.matchAll(/(.*)(www.youtube.com\/watch\?v=)(.*)/g)]
  return matches.length > 0 ? matches[0][3] : null
}

// fetcher
type YoutubeVideoData = { title: string; description: string; published: string; thumbnail: string }
const youtubeVideoFetcher = async (videoId: string) => {
  const videoData = await fetch(
    `${base}/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
  ).then((v) => v.json())

  if (!videoData) return null

  const title = videoData.items[0].snippet.title as string
  const description = videoData.items[0].snippet.description as string
  const published = videoData.items[0].snippet.publishedAt as string
  const thumbnail =
    videoData.items[0].snippet.thumbnails.maxres?.url ||
    videoData.items[0].snippet.thumbnails.high?.url ||
    videoData.items[0].snippet.thumbnails.medium?.url ||
    videoData.items[0].snippet.thumbnails.default?.url

  return { title, description, published, thumbnail } as YoutubeVideoData
}

const youtubeVideoUpdater = async (nodeId: number, videoData: YoutubeVideoData) => {

  const path = await saveImage(videoData.thumbnail, 'thumbnails')

  // update the data
  await prisma.node.update({
    where: { id: nodeId },
    data: {
      metadata: {
        create: [
          { key: 'title', type: 'string', value: videoData.title },
          { key: 'description', type: 'string', value: videoData.description },
          { key: 'published', type: 'date', value: videoData.published },
        ],
      },
      icon: {
        create: {
          path: path,
          source: videoData.thumbnail,
        },
      },
    },
  })

}

const youtubeVideo = {
  matcher: youtubeVideoMatcher,
  fetcher: youtubeVideoFetcher,
  updater: youtubeVideoUpdater
}




export default async (nodeId: number, uri: string) => {
  const handlers = [ youtubeVideo, youtubeChannel ]

  for (const handler of handlers) {
    const match = handler.matcher(uri)
    if (! match) continue
    
    const data = await handler.fetcher(match)
    if (! data) return

    // @ts-ignore
    await handler.updater(nodeId, data)
  }
}