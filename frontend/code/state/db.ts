import { Item } from 'frontend/code/state/item'
import { Query } from 'frontend/code/state/query'

export class DB {

    private baseURL: string

    constructor(baseURL: string) {
        this.baseURL = baseURL
    }

    async query(q: Query): Promise<Item[]> {
        const url = `${this.baseURL}/${q.toUrlParams()}`
        const results = await fetch(url).then(v => v.json()).then(v => v.db.map((v: Item) => {
            if (v.date.created) v.date.created = new Date(v.date.created)
            if (v.date.updated) v.date.updated = new Date(v.date.updated)
            if (v.date.archived) v.date.archived = new Date(v.date.archived)
            return v
        })) as Item[]
        return results

    }

    async create() {

    }

    async update() {

    }

    async delete() {

    }
}
