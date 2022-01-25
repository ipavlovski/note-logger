// import * as monaco from 'monaco-editor'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { Observable, timer } from 'rxjs'
import { debounce } from 'rxjs/operators'

// EDITOR:
// events:
// 'change' - change event 
// 'cancel' - cancel edit of an activated item
// 'enter' - finish/split event (depending on context)
// methods:
// setContents(text) - show content of
// clearFull() - empty the contents of the editor
// clearPartial() - emoty after the point

export default class Editor extends EventTarget {
    el: Element
    editor: monaco.editor.IStandaloneCodeEditor

    constructor() {
        super()
        this.el = document.getElementById("editor")
        this.editor = monaco.editor.create(this.el as HTMLElement, {
            value: '',
            language: "markdwown",
            fontSize: 16,
            minimap: { enabled: false },
            theme: "vs-dark",
            automaticLayout: true 
        })

        
        const obs = new Observable(observer => {
            this.editor.getModel().onDidChangeContent((event) => {
                observer.next(event)
            })
        })
        obs.pipe(
            debounce(() => timer(300))
        ).subscribe(() => this.dispatchEvent(new Event('create-item')))
    }

    setContents(text: string) {
        this.editor.setValue(text)
    }

    clearFull() {
        // todo: remove ALL text
    }

    clearPArtial() {
        // todo: remove SOME text
    }

}
