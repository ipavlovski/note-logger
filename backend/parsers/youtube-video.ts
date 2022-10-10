import { STORAGE_DIRECTORY, YOUTUBE_API_KEY } from 'backend/config'
import fetch from 'node-fetch'
import { PrismaClient } from '@prisma/client'
import { fetchImageBuffer, saveAsIcon, saveAsPreview } from 'backend/util'
import { Parser } from 'backend/routes/node'

const prisma = new PrismaClient()

const base = 'https://youtube.googleapis.com/youtube/v3'

////////////// YOUTUBE VIDEO: MATCHER, FETCHER, INSERTER

// matcher
const youtubeVideoMatcher = (uri: string) => {
  const matches = [...uri.matchAll(/(.*)(www.youtube.com\/watch\?v=)(.*)/g)]
  return matches.length > 0 ? matches[0][3] : null
}

// fetcher
const youtubeVideoFetcher = async (videoId: string) => {
  const videoData = await fetch(
    `${base}/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
  ).then(v => v.json())

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
  // save full-res image as preview

  const buffer = await fetchImageBuffer(videoData.thumbnail)
  const iconPath = await saveAsIcon(buffer)
  const previewPath = await saveAsPreview(buffer)

  // // save compressed image as icon
  // const path = await saveImage(videoData.thumbnail, 'thumbnails')

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


export type YoutubeVideoData = {
  title: string
  description: string
  published: string
  thumbnail: string
}
export const youtubeVideoParser: Parser<YoutubeVideoData> = {
  matcher: youtubeVideoMatcher,
  fetcher: youtubeVideoFetcher,
  updater: youtubeVideoUpdater,
}
