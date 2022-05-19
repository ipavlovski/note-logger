import * as cheerio from 'cheerio'
import { createWriteStream, writeFile } from 'fs'
import fetch from 'node-fetch'
import pageIcon from 'page-icon'
import { URL } from 'url'

const MEDIA_DIRECTORY = './media'


////////////// FAVICON AND TITLE

// THIS IS THE FIRST IMPLEMENTATION

// await downloadIcon('test1.png', 'https://www.youtube.com/feed/explore')
// await downloadIcon('test1.png', 'https://www.youtube.com/channel/UCZ72zDm2feverqV7qAbNH7Q')
// await downloadIcon('test1.png', 'https://atlassian.design/')
async function downloadIcon(path: string, url: string) {
  const result = await pageIcon(url)
  writeFile(path, result.data, err => {
    if (err) throw err
  })
  console.log('Success.')
}

// CURRENTLY WORKING WITH THIS IMPLEMENTATION

async function downloadImage(url: URL, iconPath: string) {
  var origin = url.origin
  var imagePath = `${MEDIA_DIRECTORY}${iconPath}`

  await fetch(`${origin}${iconPath}`).then(res => {
    const ws = createWriteStream(imagePath)
    res.body.pipe(ws)
  })

  return imagePath
}

function getFavicon($: cheerio.CheerioAPI) {
  const options = [
    $('link[rel=apple-touch-icon-precomposed]').attr('href'),
    $('link[rel=icon]').attr('href'),
    $('link[rel="shortcut icon"]').attr('href'),
  ]
  return options.filter(v => v && v.length > 0)
}

function getTitle($: cheerio.CheerioAPI) {
  const options = [
    $('meta[itemprop=name]').attr('content'),
    $('meta[property=og:title]').attr('content'),
  ]
  return options.filter(v => v && v.length > 0)
}


async function genericFilter(url: URL) {
  const html = await fetch(url).then(v => v.text())
  const $ = cheerio.load(html)
  const titles = getTitle($)
  const favicons = getFavicon($)

  const image = favicons.length > 0 ? await downloadImage(url, favicons[0]!) : ''
  const title = titles.length > 0 ? titles[0] : ''

  return {
    image,
    title,
  }
}

export { genericFilter }
