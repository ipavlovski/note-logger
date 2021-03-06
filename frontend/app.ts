import { HttpClient } from 'frontend/code/state/client'
import { BroadcastReceiver } from 'frontend/code/state/socket'
import Content from 'frontend/code/ui/content'
import Editor from 'frontend/code/ui/editor'
import Omnibar from 'frontend/code/ui/omnibar'
import Sidebar from 'frontend/code/ui/sidebar'
import hotkeys from 'hotkeys-js'
import { serverHost, serverPort } from 'common/config'

import 'frontend/styles/modal.css'
import 'frontend/styles/styles.css'
import Session from 'frontend/code/state/session'
import Metabar from 'frontend/code/ui/metabar'


export default class App {

    // data component
    session: Session

    // view components
    editor: Editor
    content: Content
    sidebar: Sidebar
    omnibar: Omnibar
    preview: HTMLElement
    metabar: Metabar

    // get all the data from localStorage
    constructor() {
        console.log("Creating an app instance @ %s", new Date().toISOString())

        this.editor = new Editor()
        this.content = new Content(this)
        this.sidebar = new Sidebar(this)


        this.handleGlobalEvents()
        this.handleShortcuts()

        
        this.metabar = new Metabar(this)
        this.preview = document.getElementById('preview')!
        
        this.session = this.latestSession()
        this.omnibar = new Omnibar(this)


    }

    //when switching sessions, previous session is fully saved in localStorage
    // can have as many sessions as desirable
    switchSessions() {
        // popup omnibar
        // show all the sessions from the list
        // choose a session
    }

    createNewSession() {
        // popup omninbar
        // use 'new-session'
    }


    private latestSession(): Session {
        return new Session('session1', this)
    }


    private handleShortcuts() {
        hotkeys('f5', function (event, handler) {
            // Prevent the default refresh event under WINDOWS system
            event.preventDefault()
            console.log('you pressed F5!')
        })

    }

    private handleGlobalEvents() {
        const globalHandler = function (event: Event) { console.log(`EVENT: ${event.type}`) }

        window.addEventListener('DOMContentLoaded', globalHandler, false)
        window.addEventListener('load', globalHandler, false)
        window.addEventListener('resize', globalHandler, false)
    }



}

declare global { var app: App }
window.app = new App()