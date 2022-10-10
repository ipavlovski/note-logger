import { STORAGE_DIRECTORY } from 'backend/config'
import { writeFile } from 'fs/promises'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

import { YOUTUBE_API_KEY } from 'backend/config'
import fetch from 'node-fetch'
import { Prisma, PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { stat } from 'fs/promises'
import { promisify } from 'util'
import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'

////////////// IMAGE PROCESSING

export const fetchImageBuffer = async (url: string) => {
  // get the image
  const imageData = await fetch(url).then(v => v.arrayBuffer())

  // create the buffer objects from the image data
  const buffer = Buffer.from(imageData)

  return buffer
}

export const saveAsPreview = async (buffer: Buffer) => {
  const sharpImage = sharp(buffer)

  // get the image format
  const { format } = await sharpImage.metadata()

  // get the path, and write file to buffer
  const path = `preview/${uuidv4()}.${format}`
  await writeFile(`${STORAGE_DIRECTORY}/${path}`, buffer)

  return path
}

export const saveAsIcon = async (buffer: Buffer) => {
  const path = `icons/${uuidv4()}.webp`
  const sharpImage = sharp(buffer)

  await sharpImage
    .resize(120, 80, {
      fit: 'inside',
    })
    .webp()
    .toFile(`${STORAGE_DIRECTORY}/${path}`)

  return path
}

////////////// MANUAL CONVERTER

export const pexec = promisify(exec)

// stream URL file to disk
async function streamFile(url: string, path: string) {
  await fetch(url).then(res => res.body.pipe(createWriteStream(path)))
}

async function manualImageConverter(url: string, path: string) {
  // create temp file name
  var tempFile = `/tmp/note-logger/${uuidv4()}`

  // download the file
  // await pexec(`curl ${url} -s -o ${tempFile}`)
  await streamFile(url, tempFile)

  // identify its mime type
  var fileType = await pexec(`file ${tempFile} -i`).then(v => v.stdout)

  // if the file has a proper mime-type
  if (fileType.includes('image/vnd.microsoft.icon')) {
    await pexec(
      `convert ico:${tempFile} -thumbnail 256x256 -alpha on -background none -flatten ${path}`
    )
  } else {
    console.log('ERROR: no matching mime type for image conversion.')
  }

  // if success, should not throw an error
  await stat(path)
}

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

async function extractLightIcon(url: string, path: string) {
  const size = `128`
  const api = `https://www.google.com/s2/favicons?sz=${size}&domain=${url}`
  console.log(api)

  const imageData = await fetch(api).then(v => v.arrayBuffer())
  const buffer = Buffer.from(imageData)
  const sharpImage = sharp(buffer)
  await sharpImage
    .resize(120, 80, {
      fit: 'inside',
    })
    .webp({ quality: 100 })
    .toFile(path)
}

async function extractLightTitle(url: string) {
  const html = await fetch(url).then(res => res.text())
  const matches = html.match(/<title>(.*?)<\/title>/)
  return matches?.[1]
}
