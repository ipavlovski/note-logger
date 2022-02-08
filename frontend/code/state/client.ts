import { serverHost, serverPort } from 'common/config'
import { Item, Query } from 'common/types'


export class HttpClient {

    async getItems(query: Query) {
        try {
            const response = await fetch('/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(query)
            })
            const results = await response.json()
            if (response.status != 200) throw new Error('ERROR!!!')
            return results as Item[]
        } catch (err) {
            console.log('catching an error from getItems!')
        }
    }

}

export const httpClient = new HttpClient()