import { FlatItem, FlatNode, FlatSection } from 'common/types'

export default class Sidebar {
    el: Element

    constructor() {
        this.el = document.querySelector("#sidebar .sleeve")!
    }


    renderAll(nodes: FlatNode[]) {
        nodes.forEach(n => n.type == 'item' ? this.renderItem(n) : this.renderSection(n))
    }

    renderItem(node: FlatItem) {
        const p = document.createElement('p')
        p.innerHTML = node.item.header
        p.classList.add("side-link", `level-${node.level}`)
        // p.addEventListener('click', this.clickHandler)
        p.setAttribute('data-id', `${node.item.id}`)

        this.el.appendChild(p)
    }

    renderSection(node: FlatSection) {
        if (node.level == 0) {
            const hr = document.createElement('hr')
            hr.classList.add('rounded')
            this.el.appendChild(hr)
        }

        const p = document.createElement('p')
        p.innerHTML = node.section[node.section.length -1 ]
        p.classList.add('side-cat', `level-${node.level}`)
        // p.addEventListener('click', this.clickHandler)

        this.el.appendChild(p)
    }

    // getSideLinkById(id: string): HTMLElement {
    //     return this.el.querySelector(`p[data-id="${id}"]`)!
    // }

    // clickHandler = (event: Event) => {
    //     const target = event.target as HTMLElement
    //     const id = target.getAttribute('data-id')!
    //     const sideLink = this.getSideLinkById(id)
    //     const entry = this.app.content.getEntryById(id)
    //     entry.scrollIntoView({ behavior: "smooth" })
    // }


}
