import * as cheerio from 'cheerio'

import { readFile } from 'fs/promises'
import { DateTime } from 'luxon'

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

interface HistoryItem {
  history_url: string
  history_title: string
  iso_date_visited: string
  client_id: string
  page_transition: string
}

interface BookmarkItem {
  bookmark_url: string
  bookmark_title: string
  iso_date_added: string
  icon_url: string
}

interface InsertArgs {
  uri: string
  title: string
  visitedAt: string
}

export default class ChromeImporter {
  private importedAt: Date

  constructor() {
    this.importedAt = new Date()
  }

  async importHistory(path: string) {
    const tags: { id: number }[] = [
      await prisma.tag.findFirstOrThrow({ where: { name: 'web' }, select: { id: true } }),
      await prisma.tag.findFirstOrThrow({ where: { name: 'history' }, select: { id: true } }),
    ]

    console.log(`Inserting history @ ${new Date().toISOString()}`)
    const history = await this.readHistory(path).then((history) =>
      history.map((hist): InsertArgs => {
        return { title: hist.history_title, uri: hist.history_url, visitedAt: hist.iso_date_visited }
      })
    )
    for (const ind in history) {
      console.log(`${ind}/${history.length}`)
      try {
        await this.dbInsert(history[ind], tags)
      } catch (err) {
        console.log(`Error @ ind=${ind}`)
      }
    }
  }

  async importBookmarks(path: string) {
    const tags: { id: number }[] = [
      await prisma.tag.findFirstOrThrow({ where: { name: 'web' }, select: { id: true } }),
      await prisma.tag.findFirstOrThrow({ where: { name: 'bookmark' }, select: { id: true } }),
    ]

    console.log(`Inserting bookmarks @ ${new Date().toISOString()}`)
    const bookmarks = await this.readBookmarks(path).then((bms) =>
      bms.map((bm): InsertArgs => {
        return { title: bm.bookmark_title, uri: bm.bookmark_url, visitedAt: bm.iso_date_added }
      })
    )
    for (const ind in bookmarks) {
      console.log(`${ind}/${bookmarks.length}`)
      try {
        await this.dbInsert(bookmarks[ind], tags)
      } catch (err) {
        console.log(`Error @ ind=${ind}`)
      }
    }
  }

  private async readBookmarks(path: string): Promise<BookmarkItem[]> {
    var file = await readFile(path, 'utf-8')
    var $ = cheerio.load(file)

    return $('a')
      .map((ind, elt) => {
        const contents = $(elt)

        const date = contents.attr('add_date')!
        const cleanDate = DateTime.fromMillis(Date.UTC(1601, 0, 1) + parseInt(date) / 1000).toISO()

        return {
          bookmark_url: contents.attr('href')!,
          bookmark_title: contents.text(),
          iso_date_added: cleanDate,
          icon_url: contents.attr('icon_uri')!,
        }
      })
      .get()
  }

  private async readHistory(path: string): Promise<HistoryItem[]> {
    var file = await readFile(path, 'utf-8')
    var hist = JSON.parse(file)

    return hist['Browser History'].map((v: any) => {
      return {
        history_url: v.url,
        history_title: v.title,
        iso_date_visited: DateTime.fromMillis(v.time_usec / 1000).toISO(),
        client_id: v.client_id,
        page_transition: v.page_transition,
      }
    })
  }

  private async dbInsert({ uri, title, visitedAt }: InsertArgs, tags: { id: number }[]) {
    let existingNode = await prisma.node.findFirst({ where: { uri } })

    if (existingNode == null) {
      return await prisma.node.create({
        data: {
          title,
          uri,
          history: { create: { visited_at: new Date(visitedAt), imported_at: this.importedAt } },
          tags: { connect: tags },
        },
      })
    }

    if (existingNode != null) {
      await prisma.node.update({ data: { tags: { connect: tags } }, where: { id: existingNode.id } })
      await prisma.history.create({
        data: {
          node_id: existingNode.id,
          visited_at: new Date(visitedAt),
          imported_at: this.importedAt,
        },
      })
    }
  }
}
