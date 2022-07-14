import { YOUTUBE_API_KEY } from 'common/config'
import fetch from 'node-fetch'


// type YoutubeChannel = ReturnType<typeof getYoutubeChannel>
interface YoutubeChannel {
  id: string
  title: string
  desc: string
  icon: string
}

interface YoutubeVideo {
  id: string
  title: string
  desc: string
  image: string
  publishedAt: string
  channelId: string
}

interface YoutubeChannelSearch {
  id: string
  title: string
  desc: string
  icon: string
}

// var tmp1 = await rawQuery('videos', 'ztpWsuUItrA')
// var tmp2 = await rawQuery('channels', 'UCsBjURrPoezykLs9EqgamOA')
// var tmp3 = await rawQuery('search', 'kralyn3d')

async function rawQuery(api: 'channels' | 'videos' | 'search', arg: string) {
  const base = 'https://youtube.googleapis.com/youtube/v3'
  let params: string
  switch (api) {
    case 'channels':
    case 'videos':
      params = `part=snippet&id=${arg}`
      break
    case 'search':
      params = `part=snippet&maxResults=1&type=channel&q=${arg}`
      break
  }

  const url = `${base}/${api}?${params}&key=${YOUTUBE_API_KEY}`
  return await fetch(url).then((v: any) => v.json())
}



// example: await getYoutubeChannel('UChWv6Pn_zP0rI6lgGt3MyfA')
export async function queryYoutubeChannels(id: string): Promise<YoutubeChannel> {
  const results = await rawQuery('channels', id)
  if (results?.items?.length == 0) throw new Error('Failed to get the channel by Id.')

  return {
    id: results.items[0].id,
    title: results.items[0].snippet.title,
    desc: results.items[0].snippet.description,
    icon: results.items[0].snippet.thumbnails.medium.url,
  }
}

// example: await getYoutubeVideo('ztpWsuUItrA')
export async function queryYoutubeVideos(id: string): Promise<YoutubeVideo> {
  const results = await rawQuery('videos', id)
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

export async function queryYoutubeSearch(channelName: string): Promise<YoutubeChannelSearch> {
  const results = await rawQuery('search', channelName)
  if (results?.items?.length == 0) throw new Error('Failed to get the channel search results.')

  return {
    id: results.items[0].id.channelId,
    title: results.items[0].snippet.title,
    desc: results.items[0].snippet.description,
    icon: results.items[0].snippet.thumbnails.medium.url,
  }
}




export async function youtubeVideoAPI(videoId: string) {
  const params = `part=snippet&id=${videoId}`
  const url = `https://youtube.googleapis.com/youtube/v3/videos?${params}&key=${YOUTUBE_API_KEY}`
  return await fetch(url).then((v: any) => v.json())
}
