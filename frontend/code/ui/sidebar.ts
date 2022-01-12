import App from 'frontend/app'
import { Item } from 'frontend/code/state/item'
import { ItemSummary } from 'frontend/code/state/view'

export default class Sidebar {
    el: Element
    app: App

    constructor(app: App) {
        this.app = app
        this.el = document.querySelector("#sidebar .sleeve")
        this.renderAll()

    }

    getSideLinkById(id: string): HTMLElement {
        return this.el.querySelector(`p[data-id="${id}"]`)
    }

    clickHandler = (event: Event) => {
        const target = event.target as HTMLElement
        const id = target.getAttribute('data-id')
        const sideLink = this.getSideLinkById(id)
        const entry = this.app.content.getEntryById(id)
        entry.scrollIntoView({ behavior: "smooth" })        
    }

    renderAll() {
        const flatView = app.view.flatten()
        flatView.forEach((v: any) => {
            if (v.type == 'catitem') this.renderSideCat(v)
            if (v.type == 'item') this.renderSideLink(v)
        })
    }

    renderSideLink(itemSummary: ItemSummary) {
        const item = itemSummary.item
        const entry = document.createElement('p')

        entry.innerHTML = item.meta.header
        entry.classList.add("side-link", `level-${itemSummary.cat.length}`)
        entry.addEventListener('click', this.clickHandler)
        entry.setAttribute('data-id', `${item.id}`)

        this.el.appendChild(entry)
    }

    renderSideCat(itemSummary: ItemSummary) {
        if (itemSummary.cat.length == 1) {
            const hr = document.createElement('hr')
            hr.classList.add('rounded')
            
            this.el.appendChild(hr)
        }
        const cat = itemSummary.cat
        const sideLink = document.createElement('p')

        sideLink.innerHTML = cat[cat.length - 1]
        sideLink.classList.add('side-cat', `level-${cat.length}`)
        sideLink.setAttribute('data-id', `${cat.join('-')}`)
        sideLink.addEventListener('click', this.clickHandler)

        this.el.appendChild(sideLink)
    }

    

}
