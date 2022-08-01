import { Prisma } from '@prisma/client'

export interface ParsedURL {
    title?: string
    icon?: { id: number; buffer: Buffer }
    pid?: number
    uri?: string
    image?: { id: number; buffer: Buffer }
    category?: string[]
  }


export interface Castable {
    insert?: Array<CastItem | CastTag | CastCat>
    update?: Array<CastItem | CastTag | CastCat>
    delete?: Array<CastItem | CastTag | CastCat>
}

export interface CastItem {
    type: 'item'
    // value: Item
}

export interface CastCat {
    type: 'cat'
    // value: CatRow
}

export interface CastTag {
    type: 'tag'
    // value: TagRow
}


export interface VideoNode {
    videoTitle: string
    videoId: string
    segments: Segment[]
  }

export type Segment = { seconds: number; title: string }
  






export interface ChromeHistoryItem {
    history_url: string
    history_title: string
    iso_date_visited: string
    client_id: string
    page_transition: string
}


export interface ChromeBookmarkItem {
    bookmark_url: string
    bookmark_title: string
    iso_date_added: string
    icon_url: string
}

export interface YoutubePlaylistItem {
    video_id: string
    iso_date_added: string
}

export interface YoutubeSearchItem {
    search_text: string
    search_url: string
    iso_date_searched: string
}

export interface YoutubeHistoryItem {
    video_url: string
    video_title: string
    channel_url: string
    channel_title: string
    iso_date_watched: string
}


const historyWithNode = Prisma.validator<Prisma.HistoryArgs>()({include: { node: true}}) 
export type HistoryWithNode = Prisma.HistoryGetPayload<typeof historyWithNode>

const nodeWithProps = Prisma.validator<Prisma.NodeArgs>()({include: { 
    parent: true,
    children: true,
    leafs: true,
    history: true,
    icon: true,
    backsplash: true,
    metadata: true,
    tags: true
  }}) 
export type NodeWithProps = Prisma.NodeGetPayload<typeof nodeWithProps>


export interface HistoryAcc {
    title: string
    children: HistoryWithNode[]
  }