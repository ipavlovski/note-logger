// recursive categorizied-map
// {
//     cat: 'cat-name',
//     items: [1, 2, 3],
//     subcat: {
//         { 
//             'sub-cat1': { cat: 'sub-cat1', items: [ 4, 5, 6], subcat: {}} 
//         },
//         { 
//             'sub-cat2': { cat: 'sub-cat2', items: [ 7, 8, 9], subcat: {}} 
//         }
//     }
// }

import { DateTime } from 'luxon'


export interface EditEntry {
    id?: number
    // use for date-created (default) or date-updated (activated)
    date: Date
    md: string
    html: string
}

export type CatMap = Map<string, CatItem>

export interface CatItem {
    cat: string
    items: Item2[]
    subcat: CatMap
}


export interface Item {
    id: number
    header: string
    body: { md: string, html: string }
    created: DateTime
    updated: DateTime
    archived: boolean
    category: CatRow[]
    tags: TagRow[]
}


export interface Item2 {
    // summary header, category chain and tags array
    meta: {
        header: string
        category: string[]
        tags: string[],
    }
    // dates in local time
    date: {
        created: DateTime
        updated?: DateTime
    }
    // actual md content with cached html
    content: {
        md: string
        html: string
    }
    // the bool translates into 0 if false and 1 if true
    archived?: boolean

    // to be populated with custom data from the post
    // will do implementation later
    // data?: {}
}

export interface DbItem2 extends Item2 {
    id: number
}

export interface ItemSummary {
    type: 'catitem' | 'item'
    name: string
    cat: string[]
    item?: Item2
    children?: number
}

export interface SortingOptions {
    sortBy: 'date' | 'category'
    subsort: 'date' | 'name'
    maxLevel?: number
}


export interface Query {
    filter: {
        categories: { rec: number[], term: number[] },
        tags: number[][]
        date: {
            created: [number, number],
            updated: [number, number]
        },
        archived: boolean
    }

    search: {
        header: string,
        body: string
    },

    pager: {
        page: number,
        size: number
    }
}

export interface SqlParams {
    q: string,
    args: any[]
}


export type CatQuery = { rec: CatRow[], term: CatRow[] }
export type TagQuery = TagRow[][]


//  ==========  DB TYPES  ==========

export interface CategoryLeaf extends CatRow {
    children: CategoryLeaf[]
}

export interface RunResult {
    changes: number
    lastID: number
}

export interface CatRow {
    id: number
    pid: number
    name: string
}

export interface TagRow {
    id: number
    name: string
}

export interface ItemRow {
    id: number
    header: string
    md: string
    html: string
    created: number
    updated: number
    archived: number
    category_id: number
}

export type  ItemUpdate = Omit<Partial<Item>, 'id'>

//  ==========  WEBSOCKET  ==========

export interface Castable {
    insert?: Array<CastItem | CastTag | CastCat>
    update?: Array<CastItem | CastTag | CastCat>
    delete?: Array<CastItem | CastTag | CastCat>
    rename?: Array<CastTag | CastCat>
}

export interface CastItem {
    type: 'item'
    value: Item
}

export interface CastCat {
    type: 'cat'
    value: CatRow
}

export interface CastTag {
    type: 'tag'
    value: TagRow
}
