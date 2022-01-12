import Editor from 'frontend/code/ui/editor'
import Content from 'frontend/code/ui/content'
import Sidebar from 'frontend/code/ui/sidebar'
import Omnibar from 'frontend/code/ui/omnibar'

import { DB } from 'frontend/code/state/db'
import { Item, ItemFactory } from 'frontend/code/state/item'
import { Query } from 'frontend/code/state/query'
import { SortingOptions, View } from 'frontend/code/state/view'

import hotkeys from 'hotkeys-js'
import { DateTime } from 'luxon'
import { fromEvent } from "rxjs"

import MicroModal from 'micromodal'
import 'frontend/styles/styles.css'
import 'frontend/styles/modal.css'
import { jsonServerPort } from 'backend/config'




export default class App {
    editor: Editor
    content: Content
    sidebar: Sidebar
    omnibar: Omnibar

    // query string
    // basic query: 'all-by-date'
    // default window is 10 entries
    query: Query
    sortOpts: SortingOptions

    // current default item of the session
    // the ID of the active item, or NULL if active==default 
    default: Item
    active: Item

    // interface objects
    view: View
    db: DB


    // get all the data from localStorage
    constructor() {
        console.log("Created an app instance @ %s", new Date().toISOString())

        // get the latest query
        // if nothing is saved, use the 'default' query (date=1m)
        const queryString = localStorage.getItem('session_query') ?? 'date=1m'
        this.query = new Query(queryString)

        // prep the DB connection
        const baseURL = localStorage.getItem('base_url') ?? `http://localhost:${jsonServerPort}/db`
        this.db = new DB(baseURL)

        // get the latest sort-order
        // if nothing is saved, use the 'date' sort
        const sortJson = localStorage.getItem('session_sortops')
        let sortOpts = JSON.parse(sortJson) as SortingOptions
        // if (! sortOpts) sortOpts = { sortBy: 'date', subsort: 'date', maxLevel: null }
        // if (! sortOpts) sortOpts = { sortBy: 'date', subsort: 'date', maxLevel: 2 }
        if (!sortOpts) sortOpts = { sortBy: 'category', subsort: 'name', maxLevel: 2 }
        this.sortOpts = sortOpts

        // if there is no default item, it means its a first boot-up or something went wrong
        // create a default item here
        const defaultString = localStorage.getItem('session_default')
        this.default = defaultString ? JSON.parse(defaultString) : this.createDefaultItem()

        // retrieve the active item if exists
        // if doesnt - do nothing (will automatically go to default)
        const activeString = localStorage.getItem('session_active')
        if (activeString) this.active = JSON.parse(activeString)

        this.omnibar = new Omnibar(this)

        this.handleGlobalEvents()
        this.handleShortcuts()
    }

    // query the DB to intiialize the view
    async init() {
        console.log("Initializing the app @", new Date().toISOString())

        // use the query to get the view items
        const items = await this.db.query(this.query)
        this.view = new View(items, this.sortOpts)

        // create the editor, fill-in with active item
        console.log("initializing editor")
        this.editor = new Editor(this)

        // then populate all of the content
        console.log("initializing content")
        this.content = new Content(this)

        // finally populate the sidebar
        console.log("initializing sidebar...")
        this.sidebar = new Sidebar(this)

        // re-arrange the items according to the sorting order
        console.log("FINISHED INIT")
        // console.log(`items: ${this.view.total()}`)
    }

    handleShortcuts() {
        hotkeys('f5', function (event, handler) {
            // Prevent the default refresh event under WINDOWS system
            event.preventDefault()
            console.log('you pressed F5!')
        })

    }

    handleGlobalEvents() {
        const globalHandler = function (event: Event) { console.log(`EVENT: ${event.type}`) }

        window.addEventListener('DOMContentLoaded', globalHandler, false)
        window.addEventListener('load', globalHandler, false)
        window.addEventListener('resize', globalHandler, false)
    }






    getCurrentItem(): Item {
        return this.default
    }

    createDefaultItem(): Item {
        const item = ItemFactory.item()
        localStorage.setItem('session_default', JSON.stringify(item))
        return item
    }

    inflateItem(stringedItem: string): Item {
        const item: Item = JSON.parse(stringedItem)
        return item
    }

    deflateItem() {

    }

    // in order to save changes, would need to:
    // take the text in the live editor
    // replace it with the current text in the 'default' item object
    // save it to the local storage
    saveChanges() {
        console.log("Saving changes...")
        const text = this.editor.editor.getValue()
        this.default.content.md = text
        this.default.date.updated = new Date()

        const json = JSON.stringify(this.default)
        localStorage.setItem("session_default", json)
    }



    archiveItem() {

    }

    deleteItem() {

    }


}


declare global {
    var app: App
}

window.app = new App()
window.app.init().then(() => console.log("INIT FINISHED @", new Date().toISOString()))
