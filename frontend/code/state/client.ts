import { Item, Query } from 'common/types'
import { vanillaReviver } from 'common/utils'


export class HttpClient {

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