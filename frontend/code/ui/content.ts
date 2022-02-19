import { FlatItem, FlatNode, FlatSection } from 'common/types'
import App from 'frontend/app'
import md from 'frontend/code/ui/md'
import hljs from 'highlight.js'



export default class Content {
    el: HTMLElement
    app: App

    constructor(app: App) {
        this.el = document.getElementById("content")!
        this.app = app
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

    addItem(itemId: number, nodes: FlatNode[]) {
        const filteredNodes = this.filterConsecutiveSections(nodes)
        const matchInd = filteredNodes.findIndex(v => v.type == 'item' && v.item.id == itemId)
        const nodeAbove = filteredNodes[matchInd - 1]

        const renderedElement = this.renderItem(filteredNodes[matchInd] as FlatItem)

        if (nodeAbove.type == 'item') {
            const match = this.el.querySelector(`[data-id="${nodeAbove.item.id}"]`)!
            match.insertAdjacentElement('afterend', renderedElement)
        } else {
            const sectionMatch = this.el.querySelector(`[data-id="${nodeAbove.section.join('>')}"]`)
            if (sectionMatch) {
                sectionMatch.insertAdjacentElement('afterend', renderedElement)
            } else {
                const renderedSection = this.renderSection(nodeAbove as FlatSection)
                const nodeAboveAbove = filteredNodes[matchInd - 2]
                if (nodeAboveAbove == null) {
                    this.el.insertAdjacentElement('afterbegin', renderedElement)
                    this.el.insertAdjacentElement('afterbegin', renderedSection)
                } else if (nodeAboveAbove.type == 'item') {
                    const match = this.el.querySelector(`[data-id="${nodeAboveAbove.item.id}"]`)!
                    match.insertAdjacentElement('afterend', renderedElement)
                    match.insertAdjacentElement('afterend', renderedSection)
                }
            }
        }

    }

    renderAll(nodes: FlatNode[]) {
        const filteredNodes = this.filterConsecutiveSections(nodes)
        filteredNodes.forEach(n => {
            const div = n.type == 'item' ? this.renderItem(n) : this.renderSection(n)
            this.el.appendChild(div)
        })
        // is this really necessary?
        hljs.highlightAll()
    }

    renderItem(node: FlatItem): HTMLDivElement {
        const div = document.createElement('div')
        div.innerHTML = md.parse(node.item.body.md)
        const tagText = node.item.tags!?.length > 0 ?
            `<p>tags: ${node.item.tags!?.map(v => v.name).join(', ')}</p>` : ''
        const catText = node.item.category!?.length > 0 ?
            `<p>cats: ${node.item.category!?.map(v => v.name).join(' > ')}</p>` : ''
        div.insertAdjacentHTML('afterbegin', `
        <h3>${node.item.header}</h3>${catText}${tagText}<hr>
        `)

        div.classList.add("entry")
        div.setAttribute('data-id', `${node.item.id}`)
        this.setupClickHandlers(div, 'item')
        return div
    }


    renderSection(node: FlatSection): HTMLDivElement {
        const div = document.createElement('div')
        div.innerHTML = node.section.join(' > ')
        div.classList.add('entry-cat', `level-${node.level}`)
        div.setAttribute('data-id', `${node.section.join('>')}`)
        this.setupClickHandlers(div, 'section')
        return div
    }


    setupClickHandlers(el: HTMLElement, type: 'item' | 'section') {
        // if section, may use slitghtly differnt logic (e.g. select ALL)
        el.addEventListener('dblclick', this.dblclickHandler)

        el.addEventListener('click', (event) => {
            if (event.shiftKey) {
                this.shiftClickHandler(event)
            }
        })
    }

    shiftClickHandler = (event: MouseEvent) => {
        var sel = window.getSelection()
        if (sel != null) sel.empty()
        console.log('SHIFT CLICKED:', event.currentTarget)

        const contentItem = event.currentTarget! as HTMLElement
        contentItem.classList.toggle('content-selected')
        
        const id = contentItem.getAttribute('data-id')
        const sideLink =  this.app.sidebar.el.querySelector(`p[data-id="${id}"]`)!
        sideLink.classList.toggle('sidebar-selected')
    }


    dblclickHandler = (event: Event) => {
        const target = event.target as HTMLElement
        const id = target.getAttribute('data-id')!
        const sideLink = this.app.sidebar.getNodeById(id)
        if (sideLink) sideLink.scrollIntoView({ behavior: "smooth", block: 'center' })

    }

    getNodeById(id: string): HTMLElement {
        return this.el.querySelector(`div[data-id="${id}"]`)!
    }

    clickHandler() {
        console.log('CLICKED!!!')
    }


}
