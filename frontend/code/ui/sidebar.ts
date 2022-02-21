import { FlatItem, FlatNode, FlatSection, Item } from 'common/types'
import App from 'frontend/app'
import { differenceWith } from 'lodash'

export default class Sidebar {
    el: Element
    app: App

    constructor(app: App) {
        this.app = app
        this.el = document.querySelector("#sidebar .sleeve")!
    }


    renderAll(nodes: FlatNode[]) {
        nodes.forEach(node => {
            const p = node.type == 'item' ? this.renderItem(node) : this.renderSection(node)
            this.el.appendChild(p)
        })
    }

    renderItem(node: FlatItem) {
        const p = document.createElement('p')
        p.innerHTML = node.item.header
        p.classList.add("side-link", `level-${node.level}`)
        p.setAttribute('data-id', `${node.item.id}`)
        
        this.setupClickHandlers(p, 'item')

        return p
    }

    renderSection(node: FlatSection) {
        if (node.level == 0) {
            const hr = document.createElement('hr')
            hr.classList.add('rounded')
            this.el.appendChild(hr)
        }

        const p = document.createElement('p')
        p.innerHTML = node.section[node.section.length - 1]
        p.classList.add('side-cat', `level-${node.level}`)
        p.setAttribute('data-id', `${node.section.join('>')}`)
        this.setupClickHandlers(p, 'section')

        return p
    }

    addItems(oldFlats: FlatNode[], newFlats: FlatNode[]) {
        const getID = (n: FlatNode) => n.type == 'item' ? n.item.id : n.section.join('>')
        const diffNodes = differenceWith(newFlats, oldFlats, (v1, v2) => getID(v1) == getID(v2))
        const topId = getID(diffNodes[0])
        const matchId = newFlats.findIndex(v => getID(v) == topId)
        if (matchId == 0 || matchId == -1) {
            diffNodes.reverse().forEach(node => {
                const rendered = node.type == 'item' ?
                    this.renderItem(node) : this.renderSection(node)
                this.el.insertAdjacentElement('afterbegin', rendered)
            })
        } else {
            const matchAboveId = getID(newFlats[matchId - 1])
            const match = this.el.querySelector(`[data-id="${matchAboveId}"]`)!
            diffNodes.reverse().forEach(node => {
                const rendered = node.type == 'item' ?
                    this.renderItem(node) : this.renderSection(node)
                match.insertAdjacentElement('afterend', rendered)
            })
        }
    }

    clear() {
        this.el.innerHTML = ""
    }

    getNodeById(id: string | number): HTMLElement {
        return this.el.querySelector(`p[data-id="${id}"]`)!
    }


    setupClickHandlers(el: HTMLElement, type: 'item' | 'section') {
        // if section, may use slitghtly differnt logic (e.g. select ALL)
        el.addEventListener('click', this.clickHandler)
    }

    clickHandler = (event: Event) => {
        const target = event.target as HTMLElement
        const id = target.getAttribute('data-id')!
        const sideLink = this.getNodeById(id)
        const entry = this.app.content.getNodeById(id)
        if (entry) entry.scrollIntoView({ behavior: "smooth", block: 'center' })

    }


}
