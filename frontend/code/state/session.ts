import CatTree from 'backend/cats'
import { serverHost, serverPort } from 'common/config'
import { Castable, FlatItem, InsertItem, Item, MetabarProps, Query, TagRow, UpdateItemOne, ViewSort } from 'common/types'
import { vanillaReviver } from 'common/utils'
import App from 'frontend/app'
import { httpClient } from 'frontend/code/state/client'
import { BroadcastReceiver } from 'frontend/code/state/socket'
import View from 'frontend/code/state/view'
import md from 'frontend/code/ui/md'
import hotkeys from 'hotkeys-js'

interface StorageState {
    id?: number
    created?: string
    md: string
    meta: string
}

export default class Session {
    meta!: { catTree: CatTree, tags: TagRow[] }
    name: string
    app: App
    view!: View

    items: Item[]
    query!: Query
    sort!: ViewSort

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

    defaults: { sort: ViewSort, query: Query } = {
        sort: { by: 'date', depth: 1 },
        query: { type: 'full', created: ['1m', null] }
    }

    constructor(sessionName: string, app: App) {
        this.name = sessionName
        this.app = app

        this.items = []

        // editor - pre-init state
        this.currUpdateItem = null

        // various hotkeys
        this.configureShortcuts()

        // listeners
        this.editorChangeListener()
        this.createItemListener()
        this.splitItemListener()
        this.socketListener()

        // init all
        this.initContent()
        this.updateEditor()

        // get metadata
        this.getMetadata()
    }

    private configureShortcuts() {
        hotkeys('shift+e', { scope: 'main' }, (event) => {
            event.preventDefault()
            console.log('shift-E clicked!')
            this.startUpdateEditing()

        })

    }

    getLocal<T>(key: string): T | null {
        const state = localStorage.getItem(`${this.name}:${key}`)
        return state != null ? JSON.parse(state, vanillaReviver) : null
    }

    setLocal(key: string, val: any) {
        localStorage.setItem(`${this.name}:${key}`, JSON.stringify(val))
    }

    async initContent() {
        try {
            const sort = this.getLocal<ViewSort>('sort') ?? this.defaults.sort
            const query = this.getLocal<Query>('query') ?? this.defaults.query
            await this.updateContent(query, sort)

        } catch (error) {
            console.log('AN ERROR OCCURED DURING INIT: reverting to defaults...')
            console.log(error)
            await this.updateContent(this.defaults.query, this.defaults.sort)
        }
    }

    async updateContent(query: Query | null, sort: ViewSort | null) {
        if (query == null) {
            query = this.query
        } else {
            this.query = query
            this.setLocal('query', query)
        }

        if (sort == null) {
            sort = this.sort
        } else {
            this.sort = sort
            this.setLocal('sort', sort)
        }

        this.items = await httpClient.getItems(query)
        this.view = new View(this.items, sort)
        const flatView = this.view.flatten()

        this.app.content.clear()
        this.app.sidebar.clear()

        this.app.content.renderAll(flatView)
        this.app.sidebar.renderAll(flatView)
    }

    updateEditor() {
        // an update item has 4 pieces of information: 2 stored and 2 embedded
        // 2 stored - id and date-created : saved into the currUpdateItem object
        // 2 ebedded : meta stored in metabar, and md stored in Editor value
        const updateState = this.getLocal<StorageState>('state:update')

        if (updateState != null) {
            this.currUpdateItem = { id: updateState.id!, created: updateState.created! } || null
            this.app.metabar.el.value = updateState.meta
            this.app.editor.editor.setValue(updateState.md)
            document.querySelector<HTMLHRElement>('hr.active-item')!.style.display = 'block'
            this.renderPreview(updateState.md)
        } else {
            const defaultState = this.getLocal<StorageState>('state:default') ?? { md: '', meta: '' }
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

            const success = await httpClient.insertItem(item)
            if (success) {
                this.app.editor.delete()
                this.app.metabar.clear()
            } else {
                this.app.metabar.flashError('Failed to create item')
            }



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

    // this is ctrl+shift+m command
    // ctrlShiftM sends an 'update item' request
    // if the metabar is empty -> only update body, with update
    private createItemListener() {
        this.app.editor.addEventListener('editor-ctrlshiftm', async (event) => {
            this.currUpdateItem == null ?
                await this.createFullDefaultItem() :
                await this.saveAndExitUpdatingItem()
        })
    }

    private async createFullDefaultItem() {
        this.app.metabar.flashError('default ctrl-shift-m not implemented yet!')
    }

    private async saveAndExitUpdatingItem() {
        const vals = this.app.metabar.getValues()
        const str = this.app.editor.editor.getValue()

        const item: UpdateItemOne = {
            body: { md: str, html: md.parse(str) },
            updated: new Date()
        }
        if (vals?.updated != null) item.updated = vals.updated

        if (vals?.header != null) item.header = vals.header
        if (vals?.created != null) item.created = vals.created
        if (vals?.category != null) item.category = vals.category
        if (vals?.tags != null) item.tags = vals.tags

        const updateSuccess = await httpClient.updateOneItem(this.currUpdateItem?.id!, item)
        if (updateSuccess) {
            this.app.editor.delete()
            this.app.metabar.clear()
            this.currUpdateItem = null
            this.setLocal('state:update', null)
            this.updateEditor()
            document.querySelector<HTMLHRElement>('hr.active-item')!.style.display = 'none'
        } else {
            this.app.metabar.flashError('Failed to update item')
        }
    }

    private socketListener() {
        this.receiver.socket.addEventListener('message', (msg: MessageEvent) => {
            console.log('MSG RECEIVED!')
            const castable: Castable = JSON.parse(msg.data.toString(), vanillaReviver)
            if (castable.insert!?.length > 0) this.receiveInsertMessage(castable.insert)
            if (castable.update!?.length > 0) this.receiveUpdateMessage(castable.update)
            // TODO: handle update, delete

        })
    }

    private receiveUpdateMessage(castable: Castable['update']) {
        console.log(`insert length: ${castable!.length}`)
        castable?.map(cast => {
            switch (cast.type) {
                case 'item':
                    const id = cast.value.id
                    const item = this.view.getById(id)
                    if (item != null) {
                        Object.assign(item, cast.value)
                        const contentElement = this.app.content.el.querySelector(`div[data-id="${id}"]`)!
                        const flatItem: FlatItem = {
                            type: 'item',
                            item: item,
                            level: parseInt(contentElement.getAttribute('data-level')!),
                            parent: contentElement.getAttribute('data-parent')!
                        }
                        const renderedContent = this.app.content.renderItem(flatItem)
                        contentElement.replaceWith(renderedContent)

                        // TODO: replace sidebar too?
                        // const sideLink = this.app.sidebar.el.querySelector(`p[data-id="${id}"]`)!
                        // sideLink.replaceWith()

                    }

                    break
                case 'cat':
                    console.log('NOT IMPLEMENTED')
                    break
                case 'tag':
                    console.log('NOT IMPLEMPLEMENTED')
                    break
            }
        })
    }


    private receiveInsertMessage(castable: Castable['insert']) {
        console.log(`insert length: ${castable!.length}`)
        castable?.map(cast => {
            switch (cast.type) {
                case 'item':
                    const oldFlatView = this.view.flatten()
                    this.items.push(cast.value)
                    this.view = new View(this.items, this.sort)
                    const flatView = this.view.flatten()
                    this.app.content.addItem(cast.value.id, flatView)
                    this.app.sidebar.addItems(oldFlatView, flatView)

                    break
                case 'cat':
                    this.meta.catTree.add(cast.value)
                    break
                case 'tag':
                    this.meta.tags.push(cast.value)
                    break
            }
        })
    }


    private startUpdateEditing() {
        var items = document.querySelectorAll('.content-selected')

        // if no item is selected
        if (items.length != 1) {
            this.app.metabar.flashError(`To edit item, one item must be selected: ${items.length} items`)
            return
        }

        // if already editing
        if (this.currUpdateItem != null) {
            this.app.metabar.flashError('Already editing an item')
            return
        }

        const id = parseInt(items[0].getAttribute('data-id')!)
        const item = this.view.getById(id)!

        this.currUpdateItem = { id: item.id!, created: item.created.toISOString()! }
        // this.app.metabar.el.value = updateState.meta
        this.app.editor.editor.setValue(item.body.md)
        this.renderPreview(item.body.md)

        document.querySelector<HTMLHRElement>('hr.active-item')!.style.display = 'block'

    }



}



