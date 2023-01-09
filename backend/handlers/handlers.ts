import { Prisma, PrismaClient } from '@prisma/client'
import type { Node } from '@prisma/client'
import sharp from 'sharp'
import type { CheerioAPI } from 'cheerio'
import * as cheerio from 'cheerio'
import { STORAGE_DIRECTORY } from 'backend/config'
import { writeFile } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

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






//  ====================================
//              MAIN HANDLER            
//  ====================================

export async function handleURI(uri: string) {

  // check for reddit
  if (redditPostMatcher(uri)) return await createRedditNode(uri)

  // check for youtube
  // if (youtubePostMatcher(uri)) return await createYoutubeNode(uri)

  // check for stack exchange
  // if (stackExchangeMatcher(uri)) return await createStackExchangeNode(uri)
}
