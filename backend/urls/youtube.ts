import { PrismaClient } from '@prisma/client'
import { queryYoutubeChannels, queryYoutubeSearch, queryYoutubeVideos } from 'backend/apis/youtube'
import { readFile } from 'node:fs/promises'
import { URL } from 'url'

const prisma = new PrismaClient()

////////////// HANDLERS

async function youtubeChannelHandler(url: URL) {
  // first, try to extract the channel ID
  // either explicit or may need a search action
  let channelId: string
  if (url.pathname.startsWith('/channel/')) {
    channelId = url.pathname.split('/')[2]
  } else {
    var channelShorthand = url.pathname.split('/c/')[1]
    const results = await queryYoutubeSearch(channelShorthand)
    channelId = results.id
    if (!channelId) throw new Error('Failed to obtain correct youtube channel id.')
  }

  // next, check if this channel ID already exists in the database
  const existingChannel = await prisma.node.findFirst({
    where: { uri: channelId },
  })
  if (existingChannel) return existingChannel

  // next, query API to get data on the youtube channel
  const channel = await queryYoutubeChannels(channelId)

  // send output back
  return {
    title: channel.title,
    uri: channel.id,
    category: ['youtube', 'channel'],
  }
}

async function youtubeVideoHandler(url: URL) {
  const videoId = url.searchParams.get('v')
  const video = await queryYoutubeVideos(videoId!)

  // check if a record exists already
  // const vidCat = await getCategory(['youtube', 'channel', 'video'])
  const vidMatch = await prisma.node.findFirst({ where: { uri: video.id } })
  if (vidMatch) return vidMatch

  // if the channel is matched
  const output = {
    title: video.title,
    uri: video.id,
    channel: video.channelId,
    category: ['youtube', 'channel', 'video'],
  }

  return output
}

////////////// MATCHERS

function youtubeChannelMatcher(url: URL) {
  return url.origin == 'https://www.youtube.com' &&
    (url.pathname.startsWith('/c/') || url.pathname.startsWith('/channel/'))
    ? true
    : false
}

function youtubeVideoMatcher(url: URL) {
  return url.origin == 'https://www.youtube.com' && url.searchParams.get('v') ? true : false
}

////////////// EXPORTS

export const youtubeChannelUrlHandler = {
  matcher: youtubeChannelMatcher,
  handler: youtubeChannelHandler,
}

export const youtubeVideoUrlHandler = {
  matcher: youtubeVideoMatcher,
  handler: youtubeVideoHandler,
}
