import { Node, PrismaClient } from '@prisma/client'
import { queryYoutubeChannels, queryYoutubeVideos } from 'backend/apis/youtube'

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
