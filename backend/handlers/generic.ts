import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import { URL } from 'url'
import { pickBy } from 'lodash'
import { saveIcon } from 'backend/db'

function extractFavicon($: cheerio.CheerioAPI) {
  const options = [
    $('link[rel=apple-touch-icon-precomposed]').attr('href'),
    $('link[rel=icon]').attr('href'),
    $('link[rel="shortcut icon"]').attr('href'),
  ]
  return options.filter(Boolean)
}

function extractTitle($: cheerio.CheerioAPI) {
  const options = [
    $('meta[itemprop=name]').attr('content'),
    $('meta[property=og:title]').attr('content'),
  ]
  return options.filter(v => v && v.length > 0)
}

async function genericFilter(url: URL) {
  const $ = await fetch(url)
    .then(v => v.text())
    .then(html => cheerio.load(html))
  const titles = extractTitle($)
  const icons = extractFavicon($)

  const icon = icons.length > 0 ? await saveIcon(`${url.origin}${icons[0]}`) : undefined
  const title = titles.length > 0 ? titles[0] : undefined

  return pickBy({ icon, title })
}

export { genericFilter }
