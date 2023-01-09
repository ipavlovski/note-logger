import { Prisma, PrismaClient } from '@prisma/client'
import type { Node } from '@prisma/client'
import sharp from 'sharp'
import type { CheerioAPI } from 'cheerio'
import * as cheerio from 'cheerio'
import { STORAGE_DIRECTORY } from 'backend/config'
import { writeFile } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { YOUTUBE_API_KEY } from 'backend/config'

// import fetch from 'node-fetch'
// import { Parser } from 'backend/routes/node'
// import { updateDomainIcon, updateMetadata } from 'backend/util'
// import sharp from 'sharp'
// import { exec } from 'child_process'
// import { createWriteStream } from 'fs'
// import { stat } from 'fs/promises'
// import fetch from 'node-fetch'
// import { promisify } from 'util'
// import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

//  =========================================
//              FAVICON AND TITLE
//  =========================================

////////////// CHEERIO/HEAVYWEIGHT SOLUTIONS

async function getCheerioUrl(url: string) {
  return await fetch(url)
    .then(v => v.text())
    .then(html => cheerio.load(html))
}

async function extractCheerioFavicon($: CheerioAPI) {
  const options = [
    $('link[rel=apple-touch-icon-precomposed]').attr('href'),
    $('link[rel=icon]').attr('href'),
    $('link[rel="shortcut icon"]').attr('href'),
  ]

  const icons = options.filter(Boolean)
  return icons.length > 0 ? icons[0] : null
}

async function extractCheerioTitle($: CheerioAPI) {
  const options = [
    $('meta[itemprop=name]').attr('content'),
    $('meta[property=og:title]').attr('content'),
  ]
  const titles = options.filter(v => v && v.length > 0)
  return titles.length > 0 ? titles[0] : null
}

////////////// LIGHTWEIGHT SOLUTIONS

async function googleFaviconCache(url: string) {
  const size = `128`
  return `https://www.google.com/s2/favicons?sz=${size}&domain=${url}`
}

async function extractLightTitle(url: string) {
  const html = await fetch(url).then(res => res.text())
  const matches = html.match(/<title>(.*?)<\/title>/)
  return matches?.[1]
}

////////////// IMAGES

async function fetchImageBuffer(url: string) {
  // get the image
  const imageData = await fetch(url).then(v => v.arrayBuffer())

  // create the buffer objects from the image data
  const buffer = Buffer.from(imageData)

  return buffer
}

async function saveAsPreview(buffer: Buffer) {
  const sharpImage = sharp(buffer)

  // get the image format
  const { format } = await sharpImage.metadata()

  // get the path, and write file to buffer
  const path = `preview/${uuidv4()}.${format}`
  await writeFile(`${STORAGE_DIRECTORY}/${path}`, buffer)

  return path
}

async function saveAsIcon(buffer: Buffer, opts?: { tint: sharp.Color }) {
  const path = `icons/${uuidv4()}.webp`
  let sharpImage = sharp(buffer)

  if (opts?.tint) sharpImage = sharpImage.tint(opts.tint)

  await sharpImage
    .resize(120, 80, {
      fit: 'inside',
    })
    .webp()
    .toFile(`${STORAGE_DIRECTORY}/${path}`)

  return path
}

//  ==============================
//              REDDIT
//  ==============================

interface RedditPostData {
  title: string
  description: string
  subreddit: string
  createdAt: string
}

interface SubredditData {
  title: string
  description: string
  subreddit: string
  createdAt: string
  icon: string
}

function redditPostMatcher(uri: string) {
  return uri.startsWith('https://www.reddit.com')
}

async function getRedditPostData(uri: string) {
  const url = `${uri.replace(/\/$/, '')}.json?raw_json=1`
  const results = await fetch(url).then(v => v.json())

  return {
    title: results[0].data.children[0].data.title,
    description: results[0].data.children[0].data.selftext,
    subreddit: results[0].data.children[0].data.subreddit_name_prefixed,
    createdAt: results[0].data.children[0].data.created_utc,
  } as RedditPostData
}

async function getSubredditData(subreddit: string) {
  const url = `https://www.reddit.com/${subreddit}/about.json?raw_json=1`
  const results = await fetch(url).then(v => v.json())

  return {
    title: results.data.display_name,
    description: results.data.public_description,
    subreddit: results.data.display_name_prefixed,
    createdAt: results.data.created_utc,
    icon: results.data.community_icon,
  } as SubredditData
}

async function createRedditNode(uri: string) {
  console.log("Reddit handler matched.")

  const postData = await getRedditPostData(uri)
  const subredditUri = `https://www.reddit.com/${postData.subreddit}`

  let parent: Node | null
  parent = await prisma.node.findFirst({
    where: { uri: subredditUri },
  })

  if (!parent) {
    // get API data used to create the parent
    const subredditData = await getSubredditData(postData.subreddit)

    // prep the icon image (either from API, or if missing then manually)
    let iconPath: string
    if (subredditData.icon != '') {
      const buffer = await fetchImageBuffer(subredditData.icon)
      iconPath = await saveAsIcon(buffer)
    } else {
      const redditFavicon = await googleFaviconCache('https://www.reddit.com/')
      const buffer = await fetchImageBuffer(redditFavicon)
      iconPath = await saveAsIcon(buffer, { tint: { r: 0, g: 100, b: 240 } })
    }

    // create the parent
    parent = await prisma.node.create({
      data: {
        title: subredditData.title,
        uri: subredditUri,
        metadata: JSON.stringify({
          description: subredditData.description,
          createdAt: subredditData.createdAt,
        }),
        icon: { create: { path: iconPath } },
      },
    })
  }

  return await prisma.node.create({
    data: {
      parent: { connect: { id: parent.id } },
      icon: { connect: { id: parent.iconId! } },
      uri: uri,
      title: postData.title,
      metadata: JSON.stringify({
        description: postData.description,
        createdAt: postData.createdAt,
      }),
    },
    include: {
      parent: true,
      icon: true,
    },
  })
}

//  ======================================
//              STACK-EXCHANGE
//  ======================================

interface StackExchangeSite {
  name: string
  url: string
  apiParam: string
}

interface StackExchangeData {
  title: string
  questionId: number
  createdAt: Date
  user: String
}

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

async function allStackExchangeSites() {
  const url = 'https://api.stackexchange.com/2.3/sites?pagesize=400'
  const sites = await fetch(url)
    .then(v => v.json())
    .then(v => v.items)

  return sites.map(
    (site: any) =>
      ({
        name: site.name,
        url: site.site_url,
        apiParam: site.api_site_parameter,
      } as StackExchangeSite)
  ) as StackExchangeSite[]
}

// from: https://stackoverflow.com/questions/44195322
function decodeEntities(encodedString: string) {
  var translate_re = /&(nbsp|amp|quot|lt|gt);/g
  var translate: any = {
    nbsp: ' ',
    amp: '&',
    quot: '"',
    lt: '<',
    gt: '>',
  }
  return encodedString
    .replace(translate_re, function (match: any, entity: any) {
      return translate[entity]
    })
    .replace(/&#(\d+);/gi, function (match, numStr) {
      var num = parseInt(numStr, 10)
      return String.fromCharCode(num)
    })
}

async function stackExchangeQuestion(id: string, site: string): Promise<StackExchangeData> {
  const link = `https://api.stackexchange.com/2.3/questions/${id}?site=${site}`
  const question = await fetch(link)
    .then(v => v.json())
    .then(v => v?.items[0])

  if (!question) throw new Error('Issue fetching stack exchange daata')

  return {
    title: decodeEntities(question.title),
    questionId: question.question_id,
    createdAt: new Date(question.creation_date * 1000),
    user: question.owner.display_name,
  } as StackExchangeData
}

function stackExchangeMatcher(uri: string) {
  const url = new URL(uri)
  const match = knownSites.find(v => url.host.endsWith(v.key))
  return match != null && url.pathname.split('/').filter(Boolean)[1] != null
}

async function createStackExchangeNode(uri: string) {
  console.log("Stack exchange handler matched.")

  const url = new URL(uri)
  const match = knownSites.find(v => url.host.endsWith(v.key))
  const questionId = url.pathname.split('/').filter(Boolean)[1]
  const seData = await stackExchangeQuestion(questionId, match!.value)

  let parent: Node | null
  parent = await prisma.node.findFirst({
    where: { uri: url.origin },
  })

  if (!parent) {
    // parent title
    const siteTitle = await extractLightTitle(url.origin)

    // parent favicon
    const seFavicon = await googleFaviconCache(url.origin)
    const buffer = await fetchImageBuffer(seFavicon)
    const iconPath = await saveAsIcon(buffer)

    // create the parent
    parent = await prisma.node.create({
      data: {
        title: siteTitle!,
        uri: url.origin,
        icon: { create: { path: iconPath } },
      },
    })
  }

  return await prisma.node.create({
    data: {
      parent: { connect: { id: parent.id } },
      icon: { connect: { id: parent.iconId! } },
      uri: uri,
      title: seData.title,
      metadata: JSON.stringify({
        createdAt: seData.createdAt,
        questionId: seData.questionId,
        user: seData.user,
      }),
    },
    include: {
      parent: true,
      icon: true,
    },
  })
}

//  ===============================
//              YOUTUBE
//  ===============================

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
  channelId: string
  channelTitle: string
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

export async function fetchVideoData(videoId: string): Promise<YoutubeVideoData> {
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
  const channelId = videoData.items[0].snippet.channelId as string
  const channelTitle = videoData.items[0].snippet.channelTitle as string

  return { title, description, published, thumbnail, channelId, channelTitle }
}

export function extractYoutubeId(url: string) {
  const matches = [...url.matchAll(/(.*)(www.youtube.com\/watch\?v=)(.{11})/g)]
  if (matches.length == 0) throw new Error('Incorrect youtube URL!')
  return matches[0][3]
}

export function buildYoutubeUri(videoId: string, seconds?: number) {
  return seconds != undefined
    ? `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`
    : `https://www.youtube.com/watch?v=${videoId}`
}



function youtubeVideoMatcher(uri: string) {
  // channel matching
  // const matches = [...uri.matchAll(/(.*)(www.youtube.com\/channel\/)(.*)/g)]
  // const channelId = matches[0][3]

  const matches = [...uri.matchAll(/(.*)(www.youtube.com\/watch\?v=)(.*)/g)]
  return matches.length > 0
}

async function createYoutubeNode(uri: string) {
  console.log("Youtube handler matched.")

  // get all the video data API
  const matches = [...uri.matchAll(/(.*)(www.youtube.com\/watch\?v=)(.*)/g)]
  const videoId = matches[0][3]
  const videoData = await fetchVideoData(videoId)

  // save full-res image as preview
  const thumbnailBuffer = await fetchImageBuffer(videoData.thumbnail)
  const videoIconPath = await saveAsIcon(thumbnailBuffer)
  const videoPreviewPath = await saveAsPreview(thumbnailBuffer)


  let parent: Node | null
  parent = await prisma.node.findFirst({
    where: { uri: `https://www.youtube.com/channel/${videoData.channelId}` },
  })

  if (!parent) {
    const channelData = await fetchChannelData(videoData.channelId)
    
    const videoIconBuffer = await fetchImageBuffer(channelData.icon)
    const channelIconPath = await saveAsIcon(videoIconBuffer)

    // create the parent
    parent = await prisma.node.create({
      data: {
        title: videoData.channelTitle,
        uri: `https://www.youtube.com/channel/${videoData.channelId}`,
        icon: { create: { path: channelIconPath, source: channelData.icon } },
      },
    })
  }

  return await prisma.node.create({
    data: {
      parent: { connect: { id: parent.id } },
      icon: { create: {path: videoIconPath, source: videoData.thumbnail } },
      preview: { create: {path: videoPreviewPath, source: videoData.thumbnail } },
      uri: uri,
      title: videoData.title,
      metadata: JSON.stringify({
        description: videoData.description,
        createdAt: videoData.published,
      }),
    },
    include: {
      parent: true,
      icon: true,
    },
  })
}




//  ===========================
//              WEB
//  ===========================

function webDomainMatcher(uri: string) {
  const url = new URL(uri)
  return url.protocol == 'https:' || url.protocol == 'http:'
}


async function createWebDomainNode(uri: string) {
  console.log("Web-domain handler matched.")

  const url = new URL(uri)
  const title = await extractLightTitle(uri)

  let parent: Node | null
  parent = await prisma.node.findFirst({
    where: { uri: url.origin },
  })

  if (!parent) {
    // parent title
    const domainTitle = await extractLightTitle(url.origin)

    // parent favicon
    const domainFavicon = await googleFaviconCache(url.origin)
    const buffer = await fetchImageBuffer(domainFavicon)
    const iconPath = await saveAsIcon(buffer)

    // create the parent
    parent = await prisma.node.create({
      data: {
        title: domainTitle!,
        uri: url.origin,
        icon: { create: { path: iconPath } },
      },
    })
  }

  return await prisma.node.create({
    data: {
      parent: { connect: { id: parent.id } },
      icon: { connect: { id: parent.iconId! } },
      uri: uri,
      title: title!,
    },
    include: {
      parent: true,
      icon: true,
    },
  })
}

//  ====================================
//              MAIN HANDLER
//  ====================================

export async function handleURI(uri: string) {
  // check for reddit
  if (redditPostMatcher(uri)) return await createRedditNode(uri)

  // check for stack exchange
  if (stackExchangeMatcher(uri)) return await createStackExchangeNode(uri)

  // check for youtube
  if (youtubeVideoMatcher(uri)) return await createYoutubeNode(uri)

  // check for regular domain
  if (webDomainMatcher(uri)) return await createWebDomainNode(uri)

  throw new Error("No handler could match the URI.")
}
