export interface Castable {
    insert?: Array<CastItem | CastTag | CastCat>
    update?: Array<CastItem | CastTag | CastCat>
    delete?: Array<CastItem | CastTag | CastCat>
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