import { CatRow, InsertItem, Item, Query, TagRow, UpdateItemOne } from 'common/types'
import { vanillaReviver } from 'common/utils'


export class HttpClient {

    async getMetadata() {
        try {
            const res = await fetch('/metadata', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })
            if (res.status != 200) throw new Error('ERROR!!!')
            var meta: { cats: CatRow[]; tags: TagRow[] } = await res.json()
            return meta
        } catch (err) {
            // should display a tost!
            console.error(err)
            return { cats: [], tags: [] }
        }
    }

    async getItems(query: Query) {
        try {
            const res = await fetch('/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(query)
            })
            if (res.status != 200) throw new Error('ERROR!!!')
            var items: Item[] = await res.text().then(txt => JSON.parse(txt, vanillaReviver))
            // const results = await response.json()
            return items
        } catch (err) {
            // should display a tost!
            console.error(err)
            return []
        }
    }

    async insertItem(item: InsertItem) {
        try {
            const res = await fetch('/insert', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            })
            if (res.status != 201) throw new Error('ERROR!!!')
            return true
        } catch (err) {
            // should display a tost!
            console.error(err)
            return false
        }
    }

    // how to update the body only?
    async updateOneItem(id: number, item: UpdateItemOne) {
        try {
            const res = await fetch(`/update/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            })
            if (res.status != 200) throw new Error('ERROR!!!')
            return true
        } catch (err) {
            // should display a tost!
            console.error(err)
            return false
        }
    }

    async deleteItem(id: number) {
        try {
            const res = await fetch(`/delete/${id}`, { method: 'DELETE' })
            if (res.status != 200) throw new Error('ERROR!!!')
            return true
        } catch (err) {
            // should display a tost!
            console.error(err)
            return false
        }
    }


}

export const httpClient = new HttpClient()