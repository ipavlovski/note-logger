import { DateTime } from 'luxon'

//  ==========  OLD TYPES  ==========

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

export interface TreeView {
    name: string
}





export interface ViewNode {
    name: string
    items: Item[]
    children: ViewNode[]
}

export type FlatNode = FlatItem | FlatSection

export interface FlatItem {
    type: 'item'
    item: Item
    parent: string
    level: number
}

export interface FlatSection {
    type: 'section'
    section: string
    parent: string
    level: number
}

export interface ViewSort {
    by: 'date' | 'cat'
    depth: number | null
    useUpdated?: boolean
}


//  ==========  NEW TYPES  ==========


export interface Query {
    type: 'full' | 'preview'
    archived?: boolean
    cats?: CatQuery | null
    tags?: TagQuery | null
    created?: [string, string | null]
    updated?: [string, string | null] | null
    search?: { header?: string, body?: string }
    pager?: { page: number, size: number }
}


export type CatQuery = { rec: CatRow[], term: CatRow[] }
export type TagQuery = TagRow[][]

export interface SqlParams {
    q: string,
    args: any[]
}


// an item ALWAYS has proper ID, HEADING and CREATED fields
// an item ALWAYS has a body: even if it just empty strings
export interface Item {
    id: number
    header: string
    created: Date
    body: { md: string, html: string }
    archived: boolean
    updated: Date | null
    category: CatRow[] | null
    tags: TagRow[] | null
}

// an InsertItem is coming from localStorage/splitPost
// an insert item CANT have an ID -> it hasnt been created yet
// it MUST have 2 fields: header + created
// the other settings are optional
export interface InsertItem {
    header: string
    created: Date
    body?: { md: string, html: string }
    updated?: Date
    archived?: boolean
    category?: CatRow[]
    tags?: TagRow[]
}

// null value -> means 'remove'
// undefined -> means 'dont touch'

export interface UpdateItemOne {
    header?: string
    created?: Date
    body?: { md: string, html: string }
    archived?: boolean
    updated?: Date | null
    category?: CatRow[] | null
    tags?: TagRow[] | null
}

export interface UpdateItemMany {
    created?: Date
    archived?: boolean
    updated?: Date | null
    category?: CatRow[] | null
    tags?: TagRow[] | null
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



export interface UpdateOneArgs {
    id: number
    item: UpdateItemOne
}

export interface UpdateManyArgs {
    ids: number[]
    item: UpdateItemMany
    op: 'add' | 'remove' | 'replace'
}

export interface RenameArgs {
    id: number
    type: 'tag' | 'cat'
    name: string
}

export interface ErrorMessage {
    type: string
    message: string
}


//  ==========  DB TYPES  ==========

export interface CategoryLeaf extends CatRow {
    children: CategoryLeaf[]
}

export interface RunResult {
    changes: number
    lastID: number
}

/**
 * @id: when null, indicates that the CatRow is new
 * @pid: when null, can be either:
 * - new cat, will be assigned ID according to previously inserted cat in chain
 *   has to have id == null also in this case
 * - top-level cat, already has an ID
 */
export interface CatRow {
    id: number | null
    pid: number | null
    name: string
}

/**
 * @id: when null, indicates that the TagRow is new
 */
export interface TagRow {
    id: number | null
    name: string
}

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
