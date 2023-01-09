// import fetch from 'node-fetch'

import { YOUTUBE_API_KEY } from 'backend/config'

interface VideoResult {
  type: string
  publishedAt: string
  videoId: string
  videoTitle: string
  videoDesc: string
  channelId: string
  channelTitle: string
}

interface YoutubeChannelData {
  description: string
  title: string
  created: string
  icon: string
}

interface YoutubeVideoData {
  title: string
  description: string
  published: string
  thumbnail: string
}


export class YoutubeAPI {
  static async queryVideo(videoId: string): Promise<VideoResult> {
    const params = `part=snippet&id=${videoId}`
    const url = `https://youtube.googleapis.com/youtube/v3/videos?${params}&key=${YOUTUBE_API_KEY}`
    return await fetch(url)
      .then(res => res.json())
      .then(res => ({
        type: res.items[0].kind,
        publishedAt: res.items[0].snippet.publishedAt,
        videoId: res.items[0].id,
        videoTitle: res.items[0].snippet.title,
        videoDesc: res.items[0].snippet.description,
        channelId: res.items[0].snippet.channelId,
        channelTitle: res.items[0].snippet.channelTitle,
      }))
  }

  static async parseChannel(channelId: string) {}
}


export async function fetchChannelData(channelId: string) {
  const base = 'https://youtube.googleapis.com/youtube/v3'

  const channelData = await fetch(
    `${base}/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
  ).then(v => v.json())

  if (!channelData) throw new Error('Issue fetching youtube channel data')

  const title = channelData.items[0].snippet.customUrl as string
  const description = channelData.items[0].snippet.description as string
  const created = channelData.items[0].snippet.publishedAt as string
  const icon = channelData.items[0].snippet.thumbnails.default.url

  return { title, description, created, icon } as YoutubeChannelData
}


export async function fetchVideoData(videoId: string) {
  const base = 'https://youtube.googleapis.com/youtube/v3'

  const videoData = await fetch(
    `${base}/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
  ).then(v => v.json())

  if (!videoData) throw new Error('Issue fetching youtube video data')

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


export function extractYoutubeId(url: string) {
  const matches = [...url.matchAll(/(.*)(www.youtube.com\/watch\?v=)(.{11})/g)]
  if (matches.length == 0) throw new Error('Incorrect youtube URL!')
  return matches[0][3]
}

export function buildYoutubeUri(videoId: string, seconds?: number) {
  return seconds != undefined ?
  `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s` :
  `https://www.youtube.com/watch?v=${videoId}`
}
