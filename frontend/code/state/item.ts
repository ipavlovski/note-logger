import { v4 as uuidv4 } from "uuid"
import { CatItem, Item } from 'frontend/types'


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

