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
        this.el = document.getElementById("monaco-editor")!
        this.editor = monaco.editor.create(this.el as HTMLElement, {
            value: '',
            language: "markdown",
            fontSize: 16,
            minimap: { enabled: false },
            theme: "vs-dark",
            automaticLayout: true,
            quickSuggestions: false
        })

        this.configureChangeEvent()
        this.configureShortcutEvents()
    }

    configureChangeEvent() {
        const obs = new Observable(observer => {
            this.editor.getModel()!.onDidChangeContent((event) => {
                observer.next(event)
            })
        })
        obs.pipe(
            debounce(() => timer(300))
        ).subscribe(() => this.dispatchEvent(new Event('editor-change-event')))
    }

    configureShortcutEvents() {

        const ctrlm = monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM
        const ctrlshiftm = monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyM

        this.editor.addCommand(ctrlm, () => {

            this.dispatchEvent(new Event('editor-ctrlm'))
        })

        this.editor.addCommand(ctrlshiftm, () => {
            this.dispatchEvent(new Event('editor-ctrlshiftm'))

        })
    }

    getSelection() {
        // get the selection objet
        var selection = this.editor.getSelection()
        if (selection == null) return null

        // extract selected text using selection object
        return this.editor.getModel()!.getValueInRange(selection)
    }

    delete() {
        // monaco.KeyCode.Backspace
        this.editor.trigger('', 'deleteLeft', null)
        // this.editor.trigger(null, 'type' , { text: '' })
    }


}
