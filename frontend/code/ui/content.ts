import { FlatItem, FlatNode, FlatSection } from 'common/types'
import md from 'frontend/code/ui/md'
import hljs from 'highlight.js'



export default class Content {
    el: HTMLElement

    constructor() {
        this.el = document.getElementById("content")!
    }



    private filterConsecutiveSections(nodes: FlatNode[]) {
        return nodes.reduce((acc: FlatNode[], curr: FlatNode, ind) => {
            if (ind == 0) return acc.concat(curr)

            const last = acc[acc.length - 1]
            if (curr.type == 'section' && last.type == 'section') {
                // replace the latest element with the current one
                acc[acc.length - 1] = curr
                return acc
            } else {
                return acc.concat(curr)
            }
        }, [])
    }

    clear() {
        this.el.innerHTML = ""
    }

    renderAll(nodes: FlatNode[]) {
        const filteredNodes = this.filterConsecutiveSections(nodes)
        filteredNodes.forEach(n => n.type == 'item' ? this.renderItem(n) : this.renderSection(n))
        // is this really necessary?
        hljs.highlightAll()
    }

    renderItem(node: FlatItem) {
        const div = document.createElement('div')
        div.innerHTML = md.parse(node.item.body.md)
        div.classList.add("entry")
        div.setAttribute('data-id', `${node.item.id}`)
        this.el.appendChild(div)
    }


    renderSection(node: FlatSection) {
        const div = document.createElement('div')
        div.innerHTML = node.section.join(' > ')
        div.classList.add('entry-cat', `level-${node.level}`)
        div.addEventListener('click', this.clickHandler)
        this.el.appendChild(div)
    }

    // getEntryById(id: string): HTMLElement {
    //     return this.el.querySelector(`div[data-id="${id}"]`)
    // }

    clickHandler() {
        console.log('CLICKED!!!')
    }


}
