import { CatRow, Item, Query, TagRow } from 'common/types'
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

}

export const httpClient = new HttpClient()