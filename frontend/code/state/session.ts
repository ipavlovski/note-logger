import App from 'frontend/app'
import { EditEntry, Query, SortingOptions } from 'common/types'
import { View } from './view'



// session listens to events:
// - editor events, to know when to re-arrange the editor
// - omnibar events, to know when to change query/re-render 
// - socket events, to know when to update contents
// session also performs data-related tasks:
// - sends query to backend using httpClient (create, update, etc)
// - saves session state to localStorage
// - boots up initial state from localStorage/sane-defaults
// session uses reference to app object to limit area of concern
// - query/sort/entries/opts are actually session related, and are included
// - 
export default class Session {
    app: App
    data: {
        items: TreeView,
        categories: TreeView,
        tags: TreeView
    }
    view: View

    // a query is sent over to backend
    query: Query
    
    // sort controls how the resulting data is organized for viewing
    sort: SortingOptions

    // entries fill-in the editor with content
    entries = {
        default: null as EditEntry,
        active: null as EditEntry
    }

    // opts control miscellaneious features
    opts = {
        scrollPosition: null as number,
        showPreview: true,
        savedQueries: [] as string[]
    }


    constructor(sessionName: string, app: App) {
        this.app = app
        this.loadSavedState(sessionName)
        this.init()
    }


    async init() {
        // send the query to the backend
        // receive the reply
        // create the view object from it
        // render the view object using content and sidebar: this.app.content.render
        const items = await this.app.httpClient.all(this.query)
        
    }

    private initListeners() {
        this.createItemListener()
    }


    private createItemListener() {
        // todo: what exactly is this 'event data'?
        this.app.editor.addEventListener('create-item', async (event) => {
            try {
                const itemProps = this.validateNewItem(event.data)
                const response = await this.app.httpClient.createItem(itemProps)
                console.log(`Create site status: ${response.status}`)
            } catch (err) {
                console.error(err)
                this.app.omnibar.showWarningMessage(err.message)
            }
        })
    }

    // check that the content is ok
    private validateNewItem(itemProps) {
        if (itemProps == 'are ok') {
            return {} as Item
        } else {
            throw new Error('An issue with prepping!')
        }
    }


    private loadSavedState(sessionName: string) {
        const savedSort = localStorage.getItem(`${sessionName}:sort`)
        const sort = JSON.parse(savedSort)
        this.sort = sort

        const savedEntries = localStorage.getItem(`${sessionName}:entries`)
        const entries = JSON.parse(savedEntries)
        this.entries = entries 
    }

    private validateEntries() {

    }

}



