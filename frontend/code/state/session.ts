import App from 'frontend/app'
import { CatRow, EditEntry, Query, SortingOptions, TagRow, TreeView, ViewSort } from 'common/types'
import View from 'frontend/code/state/view'
import { httpClient } from 'frontend/code/state/client'
import md from 'frontend/code/ui/md'
import CatTree from 'backend/cats'

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
export default class Session {
    meta: { catTree: CatTree, tags: TagRow[] } 
    name: string
    app: App
    view: View
    query: Query
    sort: ViewSort

    // entries fill-in the editor with content
    updating: boolean

    // opts control miscellaneious features
    // TODO: get these opts from saved JSON. Setup a type for easy json typings
    opts: { scrollPos: number | null, showPreview: boolean, savedQueries: string[] } = {
        scrollPos: null,
        showPreview: true,
        savedQueries: []
    }

    constructor(sessionName: string, app: App) {
        this.name = sessionName
        this.app = app

        // content - pre-init state
        this.sort = { by: 'date', depth: null }
        this.view = new View([], this.sort)
        this.query = { type: 'full' }
        this.meta = { catTree: null!, tags: [] }

        // editor - pre-init state
        this.updating = false

        // listeners
        this.createItemListener()

        // init all
        this.initContent()
        this.initEditor()

        // get metadata
        this.getMetadata()
    }

    private getLocal<T>(key: string): T | null {
        const state = localStorage.getItem(`${this.name}:${key}`)
        return state != null ? JSON.parse(state) : null
    }

    async initContent() {
        // const defaultSort: ViewSort = { by: 'date', depth: 1 }
        const defaultSort: ViewSort = { by: 'cat', depth: 2 }
        this.sort = this.getLocal<ViewSort>('sort') ?? defaultSort

        const defaultQuery: Query = {
            type: 'full', tags: [[{ id: 11, name: 'tag10' }, { id: 12, name: 'tag11' }]]
        }
        this.query = this.getLocal<Query>('query') ?? defaultQuery
        const items = await httpClient.getItems(this.query) ?? []
        this.view = new View(items, this.sort)

        console.log('VIEW LEN:', this.view.nodes.length)
        this.app.content.renderAll(this.view.flatten())
        this.app.sidebar.renderAll(this.view.flatten())
    }

    async initEditor() {
        this.updating = this.getLocal<boolean>('active') ?? false
        // TODO: how to init editor?
    }

    async getMetadata() {
        const meta = await httpClient.getMetadata() ?? []
        this.meta = { catTree: new CatTree(meta.cats), tags: meta.tags }
    }





    private createItemListener() {
        // todo: what exactly is this 'event data'?
        this.app.editor.addEventListener('editor-change-event', async (event) => {
            try {
                console.log('CHANGE DETECTED!')

                const val = this.app.editor.editor.getValue()
                this.app.preview.innerHTML = md.parse(val)
                

                // const itemProps = this.validateNewItem(event.data)
                // const response = await httpClient.createItem(itemProps)
                // console.log(`Create site status: ${response.status}`)
            } catch (err) {
                console.error(err)
                // this.app.omnibar.showWarningMessage(err.message)
            }
        })
    }

}



