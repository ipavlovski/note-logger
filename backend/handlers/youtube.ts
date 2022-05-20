import { PrismaClient } from '@prisma/client'
import { getCategory, insertYoutubeChannelNode, saveIcon } from 'backend/db'
import { YOUTUBE_API_KEY } from 'common/config'
import fetch from 'node-fetch'
import { URL } from 'url'

const prisma = new PrismaClient()

// type YoutubeChannel = ReturnType<typeof getYoutubeChannel>
export interface YoutubeChannel {
  id: string
  title: string
  desc: string
  icon: string
}

export interface YoutubeVideo {
  id: string
  title: string
  desc: string
  image: string
  publishedAt: string
  channelId: string
}

// example: await queryYoutube('videos', 'ztpWsuUItrA')
// example: await queryYoutube('channels', 'UCsBjURrPoezykLs9EqgamOA')
async function queryYoutube(target: 'channels' | 'videos', id: string) {
  const base = 'https://youtube.googleapis.com/youtube/v3'
  const part = 'snippet'
  const url = `${base}/${target}?part=${part}&id=${id}&key=${YOUTUBE_API_KEY}`
  return await fetch(url).then((v: any) => v.json())
}

// var tmp = await youtubeSearchShorthand('kralyn3d')
async function youtubeSearchShorthand(shorthand: string) {
  const base = 'https://youtube.googleapis.com/youtube/v3'
  const op = 'search'
  const params = 'part=snippet&maxResults=1&type=channel'

  var query = `${base}/${op}?${params}&q=${shorthand}&key=${YOUTUBE_API_KEY}`
  return await fetch(query).then((v: any) => v.json())
}

// example: await getYoutubeChannel('UChWv6Pn_zP0rI6lgGt3MyfA')
async function youtubeChannelAPI(id: string): Promise<YoutubeChannel> {
  const results = await queryYoutube('channels', id)
  if (results?.items?.length == 0) throw new Error('Failed to get the channel by Id.')

  return {
    id: results.items[0].id,
    title: results.items[0].snippet.title,
    desc: results.items[0].snippet.description,
    icon: results.items[0].snippet.thumbnails.medium.url,
  }
}

// example: await getYoutubeVideo('ztpWsuUItrA')
async function youtubeVideoAPI(id: string): Promise<YoutubeVideo> {
  const results = await queryYoutube('videos', id)
  if (results?.items?.length == 0) throw new Error('Failed to get the video by Id.')

  const thumbs = results.items[0].snippet.thumbnails
  return {
    id: results.items[0].id,
    title: results.items[0].snippet.title,
    desc: results.items[0].snippet.description,
    image: thumbs.maxres?.url || thumbs.high.url,
    publishedAt: results.items[0].snippet.publishedAt,
    channelId: results.items[0].snippet.channelId,
  }
}

// note: if the channel doesn't exist, throw an error
async function getOrCreateYoutubeChannel(channelId: string) {
  // check if the channel exists in the database
  const channelRecord = await prisma.node.findFirst({ where: { uri: channelId, pid: null } })
  if (channelRecord) return channelRecord

  // get data for the youtube channel
  const channel = await youtubeChannelAPI(channelId)

  // create the youtube chanel
  const result = await insertYoutubeChannelNode(channel)

  if (!result) throw new Error('Failed to get/create a channel.')
  return result
}

// 'ztpWsuUItrA'
async function getOrCreateYoutubeVideo(videoId: string) {
  // get the video data using the API
  const videoData = await youtubeVideoAPI(videoId)

  // get or create associated channel
  const channelRecord = await getOrCreateYoutubeChannel(videoData.channelId)

  // if the video already exists, then don't add it again
  const match = await prisma.node.findFirst({
    where: {
      pid: channelRecord.id,
      uri: videoData.id,
    },
  })
  if (match) return match

  // get the proper category for video
  const videoCategory = await getCategory(['youtube', 'channel', 'video'])

  // create the video entry
  return await prisma.node.create({
    data: {
      // pid: channelRecord.id,
      parent: { connect: { id: channelRecord.id } },
      title: videoData.title,
      uri: videoData.id,
      // categoryId: videoCategory!.id,
      category: { connect: { id: videoCategory!.id } },
      icon: { create: { path: 'adff' } },
      meta: {
        create: [
          { key: 'description', value: videoData.desc, type: 'text' },
          { key: 'published_at', value: videoData.publishedAt, type: 'date' },
        ],
      },
      leafs: {
        create: [{ type: 'meta', content: '' }],
      },
    },
  })
}

async function handleYoutubeChannel(url: URL) {
  // first, try to extract the channel ID
  // either explicit or may need a search action
  let channelId: string
  if (url.pathname.startsWith('/channel/')) {
    channelId = url.pathname.split('/')[2]
  } else {
    var channelShorthand = url.pathname.split('/c/')[1]
    const results = await youtubeSearchShorthand(channelShorthand)
    channelId = results?.items[0]?.id?.channelId as string
    if (!channelId) throw new Error('Failed to obtain correct youtube channel id.')
  }

  // next, check if this channel ID already exists in the database
  const existingChannel = await prisma.node.findFirst({
    where: {
      uri: channelId,
      category: { name: 'channel' },
    },
  })
  if (existingChannel) return existingChannel

  // next, query API to get data on the youtube channel
  const channel = await youtubeChannelAPI(channelId)
  const icon = await saveIcon(channel.icon)
  icon.path
  icon.id

  // send output back
  return {
    title: channel.title,
    uri: channel.id,
    icon: channel.icon,
    category: ['youtube', 'channel'],
  }
}

async function handleYoutubeVideo(videoId: string) {
  const video = await youtubeVideoAPI(videoId)

  const output = {
    title: video.title,
    uri: video.id,
    image: video.image,
    category: ['youtube', 'channel', 'video'],
  }

  return output
}

async function youtubeFilter(url: URL) {
  if (url.origin != 'https://www.youtube.com') return null

  const videoId = url.searchParams.get('v')
  if (videoId) {
    return await handleYoutubeVideo(videoId)
  }

  if (url.pathname.startsWith('/c/') || url.pathname.startsWith('/channel/')) {
    return await handleYoutubeChannel(url)
  }

  return null
}

export { youtubeFilter }
