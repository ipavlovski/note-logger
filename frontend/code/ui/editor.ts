// import * as monaco from 'monaco-editor'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { Observable, interval, timer } from 'rxjs'
import { scan, debounce, tap, map } from 'rxjs/operators'

import { Item } from 'frontend/code/state/item'
import App from 'frontend/app'

export default class Editor {
    el: Element
    editor: monaco.editor.IStandaloneCodeEditor
    app: App

    constructor(app: App) {
        console.log("Creating the editor instance!")
        // check that view.length > 0
        // only then proceed

        // check that active != null
        // otherwise assign active view[0].id

        this.app = app
        const item: Item = app.getCurrentItem()

        this.el = document.getElementById("editor")
        this.editor = monaco.editor.create(this.el as HTMLElement, {
            value: item.content.md,
            language: "markdwown",
            fontSize: 16,
            minimap: { enabled: false },
            theme: "vs-dark",
            automaticLayout: true 
        })

        
        // app will 
        const obs = new Observable(observer => {
            this.editor.getModel().onDidChangeContent((event) => {
                observer.next(event)
            })
        })
        obs.pipe(
            debounce(() => timer(300))
        ).subscribe(this.app.saveChanges)
    }




}
