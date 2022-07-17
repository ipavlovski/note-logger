import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { STORAGE_DIRECTORY } from 'common/config'
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { stat } from 'fs/promises'
import { nanoid } from 'nanoid'
import fetch from 'node-fetch'
import sharp from 'sharp'
import { promisify } from 'util'
import * as cheerio from 'cheerio'
import { URL } from 'url'

const prisma = new PrismaClient()

export const pexec = promisify(exec)

async function manualImageConverter(url: string, path: string) {
  // create temp file name
  var tempFile = `/tmp/note-logger/${nanoid(14)}`

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

export async function streamFile(url: string, path: string) {
  await fetch(url).then(res => {
    const ws = createWriteStream(path)
    res.body.pipe(ws)
  })
}

export async function saveIcon(url: string) {
  const path = `${STORAGE_DIRECTORY}/icons/${nanoid(14)}.webp`
  const res = await fetch(url)
  const buff = Buffer.from(await res.arrayBuffer())

  try {
    await sharp(buff).resize(256, 256).webp().toFile(path)
  } catch {
    await manualImageConverter(url, path)
  }

  return await prisma.icon.create({ data: { path: path, source: url } })
}

export async function saveImage(url: string) {
  const path = `${STORAGE_DIRECTORY}/images/${nanoid(14)}.webp`
  const res = await fetch(url)
  const buff = Buffer.from(await res.arrayBuffer())
  await sharp(buff).webp().toFile(path)

  return await prisma.image.create({ data: { path: path, source: url } })
}

export async function saveBacksplash(url: string) {
  const path = `${STORAGE_DIRECTORY}/backsplashes/${nanoid(14)}.webp`
  const res = await fetch(url)
  const buff = Buffer.from(await res.arrayBuffer())
  await sharp(buff).webp().toFile(path)

  return await prisma.backsplash.create({ data: { path: path, source: url } })
}


export async function extractFavicon(url: string) {
  const $ = await fetch(url)
    .then(v => v.text())
    .then(html => cheerio.load(html))

  const options = [
    $('link[rel=apple-touch-icon-precomposed]').attr('href'),
    $('link[rel=icon]').attr('href'),
    $('link[rel="shortcut icon"]').attr('href'),
  ]

  const icons = options.filter(Boolean)
  return icons.length > 0 ? icons[0] : undefined
}

export async function extractTitle(url: URL) {
  const $ = await fetch(url)
    .then(v => v.text())
    .then(html => cheerio.load(html))

    const options = [
    $('meta[itemprop=name]').attr('content'),
    $('meta[property=og:title]').attr('content'),
  ]
  const titles =  options.filter(v => v && v.length > 0)
  return titles.length > 0 ? titles[0] : undefined
}

