import App from 'frontend/app'
import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'
import { Item } from 'frontend/code/state/item'
import { ItemSummary } from 'frontend/code/state/view'

// import hljs from 'highlight.js/lib/core'
// import javascript from 'highlight.js/lib/languages/javascript'
// import bash from 'highlight.js/lib/languages/bash'
// import typescript from 'highlight.js/lib/languages/typescript'
// hljs.registerLanguage('javascript', javascript)
// hljs.registerLanguage('bash', bash)
// hljs.registerLanguage('typescript', typescript)
// import 'highlight.js/styles/base16/darkmoss.css'

export default class Content {
    el: Element
    md: MarkdownIt
    app: App

    constructor(app: App) {
        this.app = app
        this.el = document.getElementById("content")
        this.initMarkdown()
        this.renderAll()
    }

    renderAll() {

        const flatView = app.view.flatten()
        flatView.forEach(v => {
            if (v.type == 'catitem') this.renderCategory(v)
            if (v.type == 'item') this.renderEntry(v)
        })

        hljs.highlightAll()
    }

    renderEntry(itemSummary: ItemSummary) {
        const entry = document.createElement('div')
        entry.innerHTML = this.md.render(itemSummary.item.content.md)
        entry.classList.add("entry")
        entry.setAttribute('data-id', `${itemSummary.item.id}`)
        document.getElementById("content").appendChild(entry)
    }


    renderCategory(itemSummary: ItemSummary) {
        const cat = itemSummary.cat
        const entryCat = document.createElement('div')

        entryCat.innerHTML = `${cat.join(' > ')}`
        entryCat.classList.add('entry-cat', `level-${cat.length}`)
        entryCat.setAttribute('data-id', `${cat.join('-')}`)
        entryCat.addEventListener('click', this.clickHandler)

        this.el.appendChild(entryCat)
    }

    getEntryById(id: string): HTMLElement {
        return this.el.querySelector(`div[data-id="${id}"]`)
    }

    clickHandler() {

    }

    initMarkdown() {
        var options: MarkdownIt.Options = {
            html: false,
            breaks: false,
            typographer:  false,
            langPrefix: 'language-',
            linkify: true,
            highlight: function (str, lang) {
                if (lang && hljs.getLanguage(lang)) return hljs.highlight(str, { language: lang }).value
                // console.log("HIGHLIGHTING!")
                // return hljs.highlight(str, { language: lang }).value
            }
        }

        this.md = new MarkdownIt(options)
    }


}
