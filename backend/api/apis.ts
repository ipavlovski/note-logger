import fetch from 'node-fetch'
import { URL } from 'url'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

interface VideoResult {
  type: string
  publishedAt: string
  videoId: string
  videoTitle: string
  videoDesc: string
  channelId: string
  channelTitle: string
}

export class YoutubeAPI {
  static async queryVideo(videoId: string): Promise<VideoResult> {
    const params = `part=snippet&id=${videoId}`
    const url = `https://youtube.googleapis.com/youtube/v3/videos?${params}&key=${YOUTUBE_API_KEY}`
    return await fetch(url)
      .then((res) => res.json())
      .then((res) => ({
        type: res.items[0].kind,
        publishedAt: res.items[0].snippet.publishedAt,
        videoId: res.items[0].id,
        videoTitle: res.items[0].snippet.title,
        videoDesc: res.items[0].snippet.description,
        channelId: res.items[0].snippet.channelId,
        channelTitle: res.items[0].snippet.channelTitle,
      }))
  }

  static async parseChannel(channelId: string) {
    
  }
}



async function handleSubreddit(url: URL) {
  // this ia a subreddit
  var href = url.href.replace(/\/$/, '')
  var subredditUrl = `${href}/about.json?raw_json=1`
  var { data } = await fetch(subredditUrl).then(v => v.json())

  // data.created_utc
  const output = {
    title: data.display_name,
    uri: data.title,
    icon: data.icon_img,
    image: data.banner_img,
    category: ['reddit', 'subreddit'],
  }

  return output
}

async function handleRedditPost(url: URL) {
  var href = url.href.replace(/\/$/, '')
  var subredditUrl = `${href}/about.json?raw_json=1`
  var results = await fetch(subredditUrl).then(v => v.json())
  var data = results[0].data.children[0].data

  const output = {
    title: data.display_name,
    uri: data.title,
    icon: data.icon_img,
    image: data.banner_img,
    category: ['reddit', 'subreddit', 'post'],
  }

  return output
}

// var url6 = 'https://www.reddit.com/r/drones/about.json?raw_json=1'
// var url6 = 'https://www.reddit.com/r/Homebuilding/about.json?raw_json=1'
// var url6 = 'https://www.reddit.com/r/Homebuilding/comments/uqsvbs/is_it_possible_to_have_a_truly_quiet_house.json?raw_json=1'
async function redditFilter(url: URL) {
  if (url.origin != 'https://www.reddit.com') return null

  const splitUrl = url.pathname.split('/').filter(Boolean)

  if (splitUrl.length == 2) {
    return await handleSubreddit(url)
  } else if (splitUrl.length == 5) {
    return await handleRedditPost(url)
  } else {
    return null
  }
}


async function allStackExchangeSites() {
  const url = 'https://api.stackexchange.com/2.3/sites?pagesize=400'
  return await fetch(url)
    .then(v => v.json())
    .then(v => v.items)
}

async function stackExchangeQuestion(id: string, site: string) {
  const link = `https://api.stackexchange.com/2.3/questions/${id}?site=${site}`
  return await fetch(link)
    .then(v => v.json())
    .then(v => v?.items[0])
}

async function stackExchangeFilter(url: URL) {
  const knownSites = [
    { key: 'stackoverflow.com', value: 'stackoverflow' },
    { key: 'serverfault.com', value: 'serverfault' },
    { key: 'superuser.com', value: 'superuser' },
    { key: 'askubuntu.com', value: 'askubuntu' },
    { key: 'gis.stackexchange.com', value: 'gis' },
    { key: 'blender.stackexchange.com', value: 'blender' },
    { key: 'opensource.stackexchange.com', value: 'opensource' },
    { key: 'stats.stackexchange.com', value: 'stats' },
    { key: 'aviation.stackexchange.com', value: 'aviation' },
    { key: 'scifi.stackexchange.com', value: 'scifi' },
    { key: 'outdoors.stackexchange.com', value: 'outdoors' },
    { key: 'electronics.stackexchange.com', value: 'electronics' },
    { key: 'physics.stackexchange.com', value: 'physics' },
    { key: 'apple.stackexchange.com', value: 'apple' },
    { key: 'unix.stackexchange.com', value: 'unix' },
  ]

  const match = knownSites.find(v => url.host.endsWith(v.key))
  if (match) {
    const questionId = url.pathname.split('/').filter(Boolean)[1]
    var question = await stackExchangeQuestion(questionId, match.value)

    const output = {
      title: question.title,
      uri: `${question.id}`,
      category: ['stack-exchange', 'stack-site', 'question'],
    }

    return output
  }

  return null
}

