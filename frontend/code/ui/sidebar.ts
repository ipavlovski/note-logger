import { FlatItem, FlatNode, FlatSection, Item } from 'common/types'
import { differenceWith } from 'lodash'

export default class Sidebar {
    el: Element

    constructor() {
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
        // p.addEventListener('click', this.clickHandler)
        p.setAttribute('data-id', `${node.item.id}`)

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
        // p.addEventListener('click', this.clickHandler)

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

        // addItem(itemId: number, nodes: FlatNode[]) {
        //     const matchInd = nodes.findIndex(v => v.type == 'item' && v.item.id == itemId)
        //     const nodeAbove = nodes[matchInd - 1]

        //     const renderedElement = this.renderItem(nodes[matchInd] as FlatItem)

        //     // if an item above is a section
        //     if (nodeAbove.type == 'item') {
        //         const match = this.el.querySelector(`[data-id="${nodeAbove.item.id}"]`)!
        //         match.insertAdjacentElement('afterend', renderedElement)

        //     } else {
        //         let adjacentElement: HTMLElement | null = null
        //         const acc: FlatNode[] = []
        //         for (let ind = (matchInd - 1); ind >= 0; ind--) {
        //             const nodeN = nodes[ind]
        //             if (nodeN.type == 'item') {
        //                 adjacentElement = this.el.querySelector(`[data-id="${nodeN.item.id}"]`)!
        //                 break
        //             }
        //             const sectionMatch = this.el.querySelector(`[data-id="${nodeN.section.join('>')}"]`)
        //             if (sectionMatch != null)  {

        //             }
        //             // this is the TOP of the node array, top-most category
        //             if (ind == 0) {
        //                 // need to push a node prior to this?
        //                 break
        //             }
        //         }

        //         if (adjacentElement == null) {
        //             this.el.insertAdjacentElement('afterbegin', renderedElement)
        //             acc.forEach(v => {
        //                 const renderedSection = this.renderSection(v as FlatSection)
        //                 this.el.insertAdjacentElement('afterbegin', renderedSection)
        //             })
        //         } else {
        //             adjacentElement.insertAdjacentElement('afterend', renderedElement)
        //             acc.forEach(v => {
        //                 const renderedSection = this.renderSection(v as FlatSection)
        //                 adjacentElement!.insertAdjacentElement('afterend', renderedSection)
        //             })
        //         }
        //     }

        // }


        clear() {
            this.el.innerHTML = ""
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
