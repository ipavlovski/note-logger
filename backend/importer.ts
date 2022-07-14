import * as cheerio from 'cheerio'
import {
  YoutubeHistoryItem,
  YoutubeSearchItem,
  YoutubePlaylistItem,
  ChromeBookmarkItem,
  ChromeHistoryItem,
} from 'common/types'
import { readFile } from 'fs/promises'
import { DateTime } from 'luxon'
import { PrismaClient } from '@prisma/client'
import { saveIcon } from 'backend/utils'
import { youtubeVideoAPI } from 'backend/apis/youtube'
const prisma = new PrismaClient()

////////////// READING-IN A FILE: YOUTUBE INPUT

export async function readYoutubeWatchHistory(path: string): Promise<YoutubeHistoryItem[]> {
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

  const filtered = output.filter(v => v.channel_url)
  return filtered.map(v => {
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

////////////// READING IN A FILE: YOUTUBE SEARCH TERMS

export async function readYoutubeSearchHistory(path: string): Promise<YoutubeSearchItem[]> {
  const file = await readFile(path, 'utf-8')
  const $ = cheerio.load(file)

  const selector = '[class="content-cell mdl-cell mdl-cell--6-col mdl-typography--body-1"]'
  return $(selector)
    .map((ind, elt) => {
      const contents = $(elt).contents()

      const date = $(contents[3]).text()
      const cleanDate = date.includes('Sept')
        ? date.replace('Sept', 'Sep').slice(0, -4)
        : date.slice(0, -4)

      return {
        search_text: $(contents[1]).text(),
        search_url: $(contents[1]).attr('href')!,
        iso_date_searched: DateTime.fromFormat(cleanDate, 'd LLL yyyy, HH:mm:ss').toISO(),
      }
    })
    .get()
}

////////////// READING IN PLAYLISTS

export async function readYoutubePlaylist(path: string): Promise<YoutubePlaylistItem[]> {
  const file = await readFile(path, 'utf-8')
  const splitLines = file.split('\n')

  return splitLines.slice(4).map(v => {
    const [video_id, date] = v.split(',')

    const cleanDate = DateTime.fromJSDate(new Date(date)).setZone('America/Halifax').toISO()

    return { video_id, iso_date_added: cleanDate }
  })
}

////////////// READING IN CHROME BOOKMARKS

export async function readChromeBookmarks(path: string): Promise<ChromeBookmarkItem[]> {
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

////////////// READING IN CHROME HISTORY

export async function readChromeHistory(path: string): Promise<ChromeHistoryItem[]> {
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

////////////// IMPORT RUNNERS

// Basic history importer function
export async function insertHistoryItem(item: ChromeHistoryItem) {
  // check if node exists
  let existingNode = await prisma.node.findFirst({ where: { uri: item.history_url } })

  // if it doesn't create it
  if (existingNode == null) {
    existingNode = await prisma.node.create({
      data: {
        title: item.history_title,
        uri: item.history_url,
      },
    })
  }

  // add a history entry to the node
  await prisma.history.create({
    data: {
      visited_at: new Date(item.iso_date_visited),
      node_id: existingNode.id,
    },
  })
}

export async function insertBookmarkItem(item: ChromeBookmarkItem) {
  // check if node exists
  let existingNode = await prisma.node.findFirst({ where: { uri: item.bookmark_url } })

  if (existingNode == null) {
    // create the node
    existingNode = await prisma.node.create({
      data: {
        title: item.bookmark_title,
        uri: item.bookmark_url,
      },
    })

    // add history entry for the node
    await prisma.history.create({
      data: {
        visited_at: new Date(item.iso_date_added),
        node_id: existingNode.id,
      },
    })
  }

  var bookmarkTag = await prisma.tag.findFirst({ where: { name: 'bookmark' } })

  await prisma.node.update({
    data: { tags: { connect: { id: bookmarkTag!.id } } },
    where: { id: existingNode.id },
  })

  // check if missing an icon
  if (existingNode?.iconId == null) {
    // check if an icon for the URI already exists
    let icon = await prisma.icon.findFirst({ where: { source: item.icon_url } })

    // try to get create a new icon, if it doesn't exist
    if (icon == null) {
      try {
        icon = await saveIcon(item.icon_url)
      } catch {
        return
      }
    }

    await prisma.node.update({ where: { id: existingNode.id }, data: { iconId: icon.id } })
  }
}

export async function insertYoutubeHistory(item: YoutubeHistoryItem) {
  // videoNodeMatch
  let videoNodeMatch = await prisma.node.findFirst({ where: { uri: item.video_url } })

  // if there IS NO matching video, perhaps there is still a matching channel
  // can then just add the video there
  if (videoNodeMatch == null) {
    let channelNodeMatch = await prisma.node.findFirst({ where: { uri: item.channel_url } })

    var tagYoutube = await prisma.tag.findFirst({ where: { name: 'youtube' } })

    // if there IS NO matching channel, then need to create the channel
    if (channelNodeMatch == null) {
      var tagChannel = await prisma.tag.findFirst({
        where: { name: 'channel', pid: tagYoutube!.id },
      })

      channelNodeMatch = await prisma.node.create({
        data: {
          title: item.channel_title,
          uri: item.channel_url,
          tags: { connect: { id: tagChannel!.id } },
        },
      })
    }

    var tagVideo = await prisma.tag.findFirst({ where: { name: 'video', pid: tagYoutube!.id } })
    videoNodeMatch = await prisma.node.create({
      data: {
        title: item.video_title,
        uri: item.video_url,
        tags: { connect: { id: tagVideo!.id } },
        pid: channelNodeMatch!.id,
      },
    })
  }

  var record = await prisma.history.create({
    data: {
      visited_at: new Date(item.iso_date_watched),
      node_id: videoNodeMatch.id,
    },
  })

  return record
}

// watch later doesn't go into history
// it needs a special
export async function insertYoutubePlaylistItem(item: YoutubePlaylistItem) {
  const videoUri = `https://www.youtube.com/watch?v=${item.video_id}`
  let videoNodeMatch = await prisma.node.findFirst({ where: { uri: videoUri } })
  const tagWatchLater = await prisma.tag.findFirst({ where: { name: 'watch-later' } })

  // if there is no match, that means need to use youtube API to create one
  if (videoNodeMatch == null) {
    const results = await youtubeVideoAPI(item.video_id)
    const channelTitle = results.items[0].snippet.channelTitle
    const channelId = results.items[0].snippet.channelId
    const videoTitle = results.items[0].snippet.title

    // check if the channel exists
    const channelUri = `https://www.youtube.com/channel/${channelId}`
    let channelNodeMatch = await prisma.node.findFirst({ where: { uri: channelUri } })
    if (channelNodeMatch == null) {
      const tagChannel = await prisma.tag.findFirst({
        where: { name: 'channel', parent: { name: 'youtube' } },
      })
      channelNodeMatch = await prisma.node.create({
        data: {
          title: channelTitle,
          uri: channelUri,
          tags: { connect: { id: tagChannel!.id } },
        },
      })
    }

    var tagVideo = await prisma.tag.findFirst({
      where: { name: 'video', parent: { name: 'youtube' } },
    })
    videoNodeMatch = await prisma.node.create({
      data: {
        title: videoTitle,
        uri: videoUri,
        tags: { connect: [{ id: tagVideo!.id }, { id: tagWatchLater!.id }] },
        pid: channelNodeMatch!.id,
      },
    })
  }

  await prisma.node.update({
    where: { id: videoNodeMatch.id },
    data: { tags: { connect: { id: tagWatchLater!.id } } },
  })

  return videoNodeMatch
}
