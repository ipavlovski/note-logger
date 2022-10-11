import sharp from 'sharp'
import type { CheerioAPI } from 'cheerio'
import * as cheerio from 'cheerio'
import fetch from 'node-fetch'


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

export async function googleFaviconCache(url: string) {
  const size = `128`
  return `https://www.google.com/s2/favicons?sz=${size}&domain=${url}`
}

export async function extractLightTitle(url: string) {
  const html = await fetch(url).then(res => res.text())
  const matches = html.match(/<title>(.*?)<\/title>/)
  return matches?.[1]
}
