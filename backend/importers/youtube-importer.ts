import * as cheerio from 'cheerio'
import { readFile } from 'fs/promises'
import { DateTime } from 'luxon'
import { PrismaClient } from '@prisma/client'
import { YoutubeAPI } from '../api/apis'

const prisma = new PrismaClient()

interface YoutubeItem {
  video_url: string
  video_title: string
  channel_url: string
  channel_title: string
  iso_date_watched: string
}

interface YoutubeTags {
  channel: { id: number }
  video: { id: number }
  playlists: { id: number }[]
}

interface PlaylistItem {
  video_id: string
  iso_date_added: string
}


// USAGE:
// const importer = new YoutubeImporter()
// await importer.importHistory('media/youtube/history/watch-history.html')
// await importer.importPlaylist('media/youtube/playlists/Watch later.csv')



export default class YoutubeImporter {
  private importedAt: Date

  constructor() {
    this.importedAt = new Date()
  }

  async importHistory(path: string) {
    const tags: YoutubeTags = {
      channel: await prisma.tag.findFirstOrThrow({ where: { name: 'channel' } }),
      video: await prisma.tag.findFirstOrThrow({ where: { name: 'video' } }),
      playlists: [
        await prisma.tag.findFirstOrThrow({ where: { name: 'history' }, select: { id: true } }),
      ],
    }

    console.log(`Reading history at ${new Date().toISOString()}`)
    const youtubeHistory = await this.readYoutubeHistory(path)

    console.log(`Saving history to DB at ${new Date().toISOString()}`)
    for (const ind in youtubeHistory) {
      console.log(`${ind}/${youtubeHistory.length}`)
      try {
        await this.dbInsert(youtubeHistory[ind], tags)        
      } catch (err) {
        console.log(`ERROR @ ind=${ind}`)
      }
    }
  }

  async importPlaylist(path: string) {
    const tags: YoutubeTags = {
      channel: await prisma.tag.findFirstOrThrow({ where: { name: 'channel' } }),
      video: await prisma.tag.findFirstOrThrow({ where: { name: 'video' } }),
      playlists: [
        await prisma.tag.findFirstOrThrow({ where: { name: 'bookmark' }, select: { id: true } }),
      ],
    }

    console.log(`Reading playlist at ${new Date().toISOString()}`)

    const playlistItems = await this.readPlaylist(path)
    for (const ind in playlistItems) {
      console.log(`${ind}/${playlistItems.length}`)
      try {
        const partialItem = playlistItems[ind]
        const fullItem = await this.completePlaylistFields(partialItem)
        await this.dbInsert(fullItem, tags)
      } catch (err) {
        console.log(`ERROR @ ind=${ind}`)
      }
    }
  }

  private async readYoutubeHistory(path: string): Promise<YoutubeItem[]> {
    const file = await readFile(path, 'utf-8')
    const $ = cheerio.load(file)

    const selector = '[class="content-cell mdl-cell mdl-cell--6-col mdl-typography--body-1"]'
    const output = $(selector)
      .map((ind, elt) => {
        const contents = $(elt).contents()
        return {
          video_url: $(contents[1]).attr('href'),
          video_title: $(contents[1]).text(),
          channel_url: $(contents[3]).attr('href'),
          channel_title: $(contents[3]).text(),
          date: $(contents[5]).text(),
        }
      })
      .get()

    const filtered = output.filter((v) => v.channel_url)
    return filtered.map((v) => {
      // clean up the date: sometimes contains Sept - must use proper 'Sep' abbreviation
      // also, remove the timezone at the end (e.g. ' ADT')
      const cleanDate = v.date.includes('Sept')
        ? v.date.replace('Sept', 'Sep').slice(0, -4)
        : v.date.slice(0, -4)

      return {
        video_url: v.video_url!,
        video_title: v.video_title,
        channel_url: v.channel_url!,
        channel_title: v.channel_title,
        iso_date_watched: DateTime.fromFormat(cleanDate, 'd LLL yyyy, HH:mm:ss').toISO(),
      }
    })
  }

  private async dbInsert(item: YoutubeItem, tags: YoutubeTags) {
    const visitedAt = new Date(item.iso_date_watched)

    let videoNodeMatch = await prisma.node.findFirst({
      where: { uri: item.video_url },
      include: { history: true },
    })

    if (videoNodeMatch != null) {
      // check if the history item already exists. if it does, do nothing
      if (videoNodeMatch.history.find((elt) => elt.visited_at.valueOf() == visitedAt.valueOf())) {
        return videoNodeMatch
      }

      // if every visited history item is earlier then this one, mark this visit as latest
      if (videoNodeMatch.history.every((elt) => elt.visited_at < visitedAt)) {
        await prisma.node.update({
          data: { lastVisitedAt: visitedAt },
          where: { id: videoNodeMatch.id },
        })
      }

      // apply tags to the existing items
      await prisma.node.update({
        data: { tags: { connect: tags.playlists } },
        where: { id: videoNodeMatch.id },
      })

      // create a new history record for the existing item
      await prisma.history.create({
        data: {
          node_id: videoNodeMatch.id,
          visited_at: new Date(item.iso_date_watched),
          imported_at: this.importedAt,
        },
      })
    }

    if (videoNodeMatch == null) {
      // if there IS NO matching video, perhaps there is still a matching channel
      let channelNodeMatch = await prisma.node.findFirst({ where: { uri: item.channel_url } })

      // if there IS NO matching channel, then need to create the channel
      if (channelNodeMatch == null) {
        channelNodeMatch = await prisma.node.create({
          data: {
            title: item.channel_title,
            uri: item.channel_url,
            tags: { connect: { id: tags.channel.id } },
          },
        })
      }

      videoNodeMatch = await prisma.node.create({
        data: {
          title: item.video_title,
          uri: item.video_url,
          tags: { connect: [{ id: tags.video.id }, ...tags.playlists] },
          pid: channelNodeMatch!.id,
          lastVisitedAt: visitedAt,
          history: {
            create: {
              visited_at: visitedAt,
              imported_at: this.importedAt,
            },
          },
        },
        include: { history: true },
      })
    }

    return videoNodeMatch
  }

  private async readPlaylist(path: string): Promise<PlaylistItem[]> {
    const file = await readFile(path, 'utf-8')
    const splitLines = file.split('\n')

    return splitLines.slice(4).map((v) => {
      const [video_id, date] = v.split(',')

      const cleanDate = DateTime.fromJSDate(new Date(date)).setZone('America/Halifax').toISO()

      return { video_id, iso_date_added: cleanDate }
    })
  }

  private async completePlaylistFields(item: PlaylistItem): Promise<YoutubeItem> {
    const videoUri = `https://www.youtube.com/watch?v=${item.video_id}`
    const videoNodeMatch = await prisma.node.findFirst({
      where: { uri: videoUri },
      include: { parent: true },
    })

    if (videoNodeMatch != null) {
      return {
        video_url: videoNodeMatch.uri,
        video_title: videoNodeMatch.title,
        channel_url: videoNodeMatch.parent!.uri,
        channel_title: videoNodeMatch.parent!.title,
        iso_date_watched: item.iso_date_added,
      }
    } else {
      const apiResults = await YoutubeAPI.queryVideo(item.video_id)
      return {
        video_url: `https://www.youtube.com/watch?v=${item.video_id}`,
        video_title: apiResults.videoTitle,
        channel_url: `https://www.youtube.com/channel/${apiResults.channelId}`,
        channel_title: apiResults.channelTitle,
        iso_date_watched: item.iso_date_added,
      }
    }
  }
}
