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
  