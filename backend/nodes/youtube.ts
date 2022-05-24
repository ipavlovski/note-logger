import { Node, PrismaClient } from '@prisma/client'
import { queryYoutubeChannels, queryYoutubeVideos } from 'backend/apis/youtube'
import { getCategory, saveIcon, saveImage } from 'backend/db'
import { CreateNodeArgs } from 'backend/routes'

import { z } from 'zod'

const prisma = new PrismaClient()

////////////// VALIDATION

interface NodeHandler {
  matcher?: string[]
  category: string[]
  handler(args: YoutubeArgs): Promise<Node>
}

interface YoutubeArgs {
  category: string[]
}

const ChannelArgs = z.object({
  //  channel can't have a parent
  parent: z.never(),
  // channel title is channel's name
  title: z.string().min(1),
  // uri is channel full ID (not shorthand)
  uri: z.string(),
  // icon is based on the DB entry from filled-in parsed URL
  icon: z.number(),
  // image is optional, comes in as b64 encoded string if exists
  image: z.string().optional(),
  // to trigger function, has to be ['youtube', 'channel']
  category: z.string().array(),
  // tags are optional - 2d array
  tags: z.string().array().array().default([]),
})
type ChannelArgs = z.infer<typeof ChannelArgs>

const VideoArgs = z.object({
  // a video may or may not have a parent
  // if it does, provide URI (not the DB id, since that may change)
  parent: z.string().optional(),
  // videos title is video's name (probably modified)
  title: z.string().min(1),
  // uri is 11 digit video-id
  uri: z.string(),
  // may create icons from video thumbnails
  // but for for now simply inherit from the channel
  icon: z.never(),
  // image comes from video thumbnail, will be downloaded server-side
  image: z.never(),
  // to trigger function, has to be ['youtube', 'channel', 'video']
  category: z.string().array(),
  // tags are optional - 2d array
  tags: z.string().array().array().default([]),
})
type VideoArgs = z.infer<typeof VideoArgs>

const SegmentArgs = z.object({
  // channel must have a URI
  parent: z.string(),
  // segment needs a name also
  title: z.string().min(1),
  // a total number of fractional seconds (e.g. 82.75 = 1min25sec)
  uri: z.string(),
  // will eventually create custom icons based on timestmape (e.g. 23:04, 01:00:03)
  // but for now, inherit from the video (which inherits from the channel)
  icon: z.never(),
  // image is optional, comes in as b64 encoded string if exists
  image: z.string().optional(),
  // to trigger function, has to be ['youtube', 'channel', 'video', 'segment']
  category: z.string().array(),
  // tags are optional - 2d array
  tags: z.string().array().array().default([]),
})
type SegmentArgs = z.infer<typeof SegmentArgs>

////////////// UTILS

// const iconRef = channelMatch ? channelMatch.icon : await getChannelIcon(video.channelId)
// icon: {
//   id: iconRef!.id,
//   file: await readFile(iconRef!.path).then(v => v.toString('base64')),
// },

// first, check for eisting channel in DB
// second, check for any references to the channel by other vids
// finally, download the image manually
async function getChannelIcon(channelUri: string) {
  // get the category for youtube channel
  const cat = await getCategory(['youtube', 'channel'])

  // if a node with same URI exists, throw an error
  const existingChannel = await prisma.node.findFirst({
    where: { uri: channelUri, categoryId: cat.id },
    include: { icon: true },
  })
  if (existingChannel?.icon) return existingChannel.icon

  // check for any other parent-less videos with the same channel using meta-field
  const match = await prisma.meta.findFirst({
    where: { key: 'channelUri', value: channelUri },
    include: { node: { include: { icon: true } } },
  })
  if (match?.node?.icon) return match.node.icon

  // query the API, download the icon
  const channel = await queryYoutubeChannels(channelUri)
  return await saveIcon(channel.icon)
}

////////////// HANDLERS

async function createYoutubeChannelNode(args: ChannelArgs) {
  // validate input
  const parsedArgs = ChannelArgs.parse(args)
  const { uri: channelId, title, icon } = parsedArgs

  // get the category for youtube channel
  const cat = await getCategory(['youtube', 'channel'])

  // if a node with same URI exists, throw an error
  if (await prisma.node.findFirst({ where: { uri: channelId, categoryId: cat.id } }))
    throw new Error('Channel with this URI already exists!')

  // get channel API data
  const channelData = await queryYoutubeChannels(channelId)

  // TODO: check for any image

  // create the channel, return created node
  return await prisma.node.create({
    data: {
      title: title,
      uri: channelId,
      category: { connect: { id: cat.id } },
      icon: { connect: { id: icon } },
      meta: {
        create: [{ key: 'description', value: channelData.desc, type: 'text' }],
      },
      leafs: {
        create: [{ type: 'meta', content: '' }],
      },
    },
  })
}

async function createYoutubeVideoNode(args: VideoArgs) {
  // validate input
  const parsedArgs = VideoArgs.parse(args)
  const { uri: videoId, title } = parsedArgs

  // get the category for youtube channel
  const videoCat = await getCategory(['youtube', 'channel', 'video'])
  const channelCat = await getCategory(['youtube', 'channel'])

  // if a node with same URI exists, throw an error
  if (await prisma.node.findFirst({ where: { uri: videoId, categoryId: videoCat.id } }))
    throw new Error('Video with this URI already exists!')

  // get video API data
  const videoData = await queryYoutubeVideos(videoId)

  // determine if video has a parent
  const channelUri = parsedArgs.parent
  let channelId
  let iconId
  if (channelUri) {
    const channel = await prisma.node.findFirst({
      where: { uri: channelUri, categoryId: channelCat.id },
    })
    channelId = channel!.id
    iconId = channel!.iconId
  } else {
    const icon = await getChannelIcon(videoData.channelId)
    channelId = undefined
    iconId = icon.id
  }

  // download the image
  const image = await saveImage(videoData.image)

  // create the channel, return created node
  return await prisma.node.create({
    data: {
      parent: { connect: { id: channelId } },
      title: title,
      uri: videoId,
      category: { connect: { id: videoCat.id } },
      icon: { connect: { id: iconId } },
      meta: {
        create: [
          { key: 'description', value: videoData.desc, type: 'text' },
          { key: 'published_at', value: videoData.publishedAt, type: 'date' },
          { key: 'channelUri', value: videoData.channelId, type: 'text' },
        ],
      },
      leafs: {
        create: [{ type: 'meta', content: '', media: { connect: { id: image.id } } }],
      },
    },
  })
}

async function createYoutubeSegmnetNode(args: SegmentArgs) {
  // validate input
  const parsedArgs = SegmentArgs.parse(args)
  const { uri: segmentUri, parent: parentUri, title } = parsedArgs

  // get the category for youtube channel
  const segmentCat = await getCategory(['youtube', 'channel', 'video', 'segment'])
  const videoCat = await getCategory(['youtube', 'channel', 'video'])

  const video = await prisma.node.findFirst({
    where: { uri: parentUri, categoryId: videoCat.id },
    include: { icon: true },
  })
  if (!video) throw new Error('Segment must have associated video in DB.')

  // create the channel, return created node
  return await prisma.node.create({
    data: {
      parent: { connect: { id: video.id } },
      title: title,
      uri: segmentUri,
      category: { connect: { id: segmentCat.id } },
      icon: { connect: { id: video?.icon?.id } },
      leafs: {
        create: [{ type: 'meta', content: '' }],
      },
    },
  })
}

////////////// EXPORTS

export const youtubeChannelNodeHandler: NodeHandler = {
  category: ['youtube', 'channel'],
  handler: createYoutubeChannelNode,
}

export const youtubeVideoNodeHandler: NodeHandler = {
  category: ['youtube', 'channel', 'video'],
  handler: createYoutubeVideoNode,
}

export const youtubeSegmentNodeHandler: NodeHandler = {
  category: ['youtube', 'channel', 'video', 'segment'],
  handler: createYoutubeSegmnetNode,
}

