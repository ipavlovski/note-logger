import { v4 as uuidv4 } from "uuid"

export interface CatItem {
    cat: string
    items: Item[]
    subcat: Map<string, CatItem>
}

export type CatMap = Map<string, CatItem>


export interface Item {
    id: string
    meta: {
        header: string
        category: string[]
        tags: string[]
    }
    date: {
        created: Date
        updated?: Date
        archived?: Date
    }
    // to be populated with custom data from the post
    data?: {}

    // contains the actual content
    content: {
        md: string
        html: string
    }
}



export class ItemFactory {
    static item(): Item {
        return {
            id: uuidv4(),
            meta: {
                header: null,
                category: [],
                tags: []
            },
            date: {
                created: new Date(),
            },
            content: {
                md: '',
                html: null
            }
        }
    }

    static catItem(cat: string): CatItem {
        return {
            cat: cat,
            items: [],
            subcat: new Map<string, CatItem>()
        }
    }
}

