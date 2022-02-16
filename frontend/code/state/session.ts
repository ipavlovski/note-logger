import CatTree from 'backend/cats'
import { Castable, InsertItem, MetabarProps, Query, TagRow, ViewSort } from 'common/types'
import App from 'frontend/app'
import { httpClient } from 'frontend/code/state/client'
import View from 'frontend/code/state/view'
import md from 'frontend/code/ui/md'
import { BroadcastReceiver } from 'frontend/code/state/socket'
import { serverHost, serverPort } from 'common/config'

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

interface StorageState {
    id?: number
    created?: string
    md: string
    meta: string
}

export default class Session {
    meta: { catTree: CatTree, tags: TagRow[] }
    name: string
    app: App
    view: View
    query: Query
    sort: ViewSort

    receiver = new BroadcastReceiver(`ws://${serverHost}:${serverPort}`)

    // entries fill-in the editor with content
    currUpdateItem: { id: number, created: string } | null

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
        this.currUpdateItem = null

        // listeners
        this.editorChangeListener()
        this.createItemListener()
        this.splitItemListener()
        this.socketListener()

        // init all
        this.initContent()
        this.initEditor()

        // get metadata
        this.getMetadata()
    }

    getLocal<T>(key: string): T | null {
        const state = localStorage.getItem(`${this.name}:${key}`)
        return state != null ? JSON.parse(state) : null
    }

    setLocal(key: string, val: any) {
        localStorage.setItem(`${this.name}:${key}`, JSON.stringify(val))
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

        this.app.content.renderAll(this.view.flatten())
        this.app.sidebar.renderAll(this.view.flatten())
    }

    async initEditor() {
        // an update item has 4 pieces of information: 2 stored and 2 embedded
        // 2 stored - id and date-created : saved into the currUpdateItem object
        // 2 ebedded : meta stored in metabar, and md stored in Editor value
        const updateState = this.getLocal<StorageState>('state:update')

        if (updateState != null) {
            this.currUpdateItem = { id: updateState.id!, created: updateState.created! } || null
            this.app.metabar.el.value = updateState.meta
            this.app.editor.editor.setValue(updateState.md)
            this.renderPreview(updateState.md)
        } else {
            const defaultState = this.getLocal<StorageState>('state:default') ??
                { md: '', meta: '' }
            this.app.metabar.el.value = defaultState.meta
            this.renderPreview(defaultState.md)
            this.app.editor.editor.setValue(defaultState.md)
        }

    }

    async getMetadata() {
        const meta = await httpClient.getMetadata() ?? []
        this.meta = { catTree: new CatTree(meta.cats), tags: meta.tags }
    }



    private editorChangeListener() {
        // todo: what exactly is this 'event data'?
        this.app.editor.addEventListener('editor-change-event', async (event) => {
            try {
                const val = this.app.editor.editor.getValue()
                this.renderPreview(val)
                this.saveEditorState(val)
            } catch (err) {
                console.error(err)
                this.app.metabar.flashError('Issue with editorChangeListener')
            }
        })
    }

    private renderPreview(str: string) {
        this.app.preview.innerHTML = md.parse(str)
    }

    private saveEditorState(md: string) {
        const meta = this.app.metabar.el.value
        const val: StorageState = this.currUpdateItem == null ? { md, meta } :
            { id: this.currUpdateItem.id, created: this.currUpdateItem.created, md, meta }
        this.currUpdateItem == null ? this.setLocal('state:default', val) :
            this.setLocal('state:update', val)
    }


    // the basic 'ctrlm' acts as a split
    private splitItemListener() {
        this.app.editor.addEventListener('editor-ctrlm', async (event) => {
            // prepare the input
            const vals: MetabarProps | null = this.app.metabar.getValues()
            const selection = this.app.editor.getSelection()
            const item = this.prepItemForSplit(vals, selection)
            if (item == null) return

            this.currUpdateItem == null ?
                await this.splitDefaultItem(item) :
                await this.splitUpdateItem(item)

        })
    }

    private prepItemForSplit(vals: MetabarProps | null, selection: string | null) {
        if (vals?.header == null) {
            this.app.metabar.flashError('Splitting an item requires a header (H:)')
            return null
        }

        if (selection == null || selection == '') {
            this.app.metabar.flashError('Splitting an item requires a selection')
            return null
        }

        // creted field can be null in update-mode, but not in default mode
        let created: Date
        if (this.currUpdateItem == null && vals?.created == null) {
            // if created=null in default mode, exit with error
            this.app.metabar.flashError('Splitting default item requires a date created (D:)')
            return null
        } else if (this.currUpdateItem != null && vals?.created == null) {
            // if created=null in update mode, use the parent-items date
            created = new Date(this.currUpdateItem.created)
        } else {
            created = new Date(vals.created!)
        }

        const item: InsertItem = {
            header: vals.header,
            created: created,
            body: {
                md: selection,
                html: md.parse(selection)
            },
            archived: false
        }
        if (vals.updated) item.updated = vals.updated
        if (vals.category) item.category = vals.category
        if (vals.tags) item.tags = vals.tags

        return item

    }

    private async splitDefaultItem(item: InsertItem) {

        // the new item should show up using the socket
        const success = await httpClient.insertItem(item)
        if (success) {
            this.app.editor.delete()
            this.app.metabar.clear()
        } else {
            this.app.metabar.flashError('Failed to create item')
        }
    }

    private async splitUpdateItem(item: InsertItem) {
        // the new item should show up using the socket
        const insertSuccess = await httpClient.insertItem(item)
        const updateSuccess = await httpClient.updateItemBody(this.currUpdateItem?.id!, item)

        // UPDATE
        if (insertSuccess && updateSuccess) {
            this.app.editor.delete()
            this.app.metabar.clear()
        } else {
            this.app.metabar.flashError('Failed to create item')
        }
    }


    private createItemListener() {
        this.app.editor.addEventListener('editor-ctrlshiftm', async (event) => {
            const vals = this.app.metabar.getValues()
            const selection = this.app.editor.getSelection()
        })
    }

    private socketListener() {
        this.receiver.socket.addEventListener('message', (msg: MessageEvent) => {
            console.log('MSG RECEIVED!')
            const castable: Castable = JSON.parse(msg.data.toString())
            
            // insert, update, delete
            // handle insert of different types
            
        })
    }
}



