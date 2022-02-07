// Basic methods:
// - create/init: flat item array into view
// - flatten/summary: take the view, linearize it (embed level #)
// - append: add a new set of items to the current view (paging)
// - resort: apply a different sorting to the set of items
// - add/update/remove node: modify individual nodes
// - findById: get the element based on the id

import { FlatNode, Item, ViewNode, ViewSortDate, ViewSortCat } from 'common/types'
import { DateTime } from 'luxon'


export default class View {
    nodes: ViewNode[]

    constructor(items: Item[], sort: ViewSortDate | ViewSortCat) {
        this.nodes = sort.primary == 'date' ?
            this.sortByDate(items, sort) : this.sortByCat(items, sort)
    }

    // how to recursively organize these items into ViewNodes:

    // takes care of 'centering the day between bounds'
    // so that 2am still belongs to the 'previous day'
    // date-agnostic: takes any date, converts to proper string
    dateToString(date: Date) {
        const HOUR_OFFSET = 5
        const dateTime = DateTime.fromJSDate(date)
        const offset = parseInt(dateTime.toFormat("Z")) - HOUR_OFFSET
        return dateTime.setZone('UTC' + (offset <= 0 ? "" : "+") + offset).toFormat("D cccc")
    }

    // 2 things still left to do:
    // choose whetther to sort by item.created vs. item.updated
    // sort items by date descending (if not being processed further)
    groupByDate(items: Item[], sort: 'created' | 'updated') {
        return items.reduce((acc: ViewNode[], item: Item) => {
            const date = sort == 'created' ? item.created : item.updated ?? item.created
            const dateString = this.dateToString(date)
            const node = acc.find(v => v.name == dateString);
            (node == null) ?
                acc.push({ name: dateString, items: [item], children: [] }) :
                node!.items.push(item)
            return acc
        }, [])
    }


    groupByTopCat(node: ViewNode) {
        const topAcc: Item[] = []
        const children = node.items.reduce((acc: ViewNode[], item: Item) => {
            // filter out uncategorized values, put them under date
            if (item.category == null) {
                topAcc.push(item)
                return acc
            }
            // process top-level cat using 0-index cat
            const catName = item.category[0].name
            const matchNode = acc.find(v => v.name == catName);
            (matchNode == null) ?
                acc.push({ name: catName, items: [item], children: [] }) :
                matchNode!.items.push(item)
            return acc
        }, [])
        node.items = topAcc
        node.children = children
        return node
    }

    recurseByCat(catNode: ViewNode, ind: number, maxInd: number | null) {
        const topAcc: Item[] = []
        const children = catNode.items.reduce((acc: ViewNode[], item: Item) => {
            // filter out items with categories matching this node
            if (item.category![ind].name == catNode.name && item.category!.length == (ind + 1)) {
                topAcc.push(item)
                return acc
            }

            const catName = item.category![ind + 1].name
            const matchNode = acc.find(v => v.name == catName);

            // if no match present, create a ViewNode and put the item there
            // otherwise add the item to an existing ViewNode 
            (matchNode == null) ?
                acc.push({ name: catName, items: [item], children: [] }) :
                matchNode!.items.push(item)
            return acc
        }, [])
        catNode.items = topAcc
        catNode.children = (children.length > 0) && (maxInd == null || (ind + 1 < maxInd)) ?
            children.map(childNode => this.recurseByCat(childNode, ind + 1, maxInd)) : children
        return catNode
    }


    flatten(nodes: ViewNode[]) {
        var acc: FlatNode[] = []
        const recurse = (node: ViewNode, level: number, parent: string) => {
            acc.push({ type: 'section', node: node.name, parent, level })
            node.items.forEach(item => {
                acc.push({ type: 'item', node: item, parent: node.name, level })
            })
            if (node.children.length > 0)
                node.children.forEach(childNode => recurse(childNode, level + 1, node.name))
        }
        nodes.forEach(topNode => recurse(topNode, 0, 'top'))
        return acc
    }

    recurseSort(nodes: ViewNode[], sort: 'created' | 'updated', asc = true, rec = true) {
        // sort this levels nodes
        const sorted = nodes.sort((a, b) => {
            const v1 = a.name.toUpperCase()
            const v2 = b.name.toUpperCase()
            return asc ? (v1 < v2 ? -1 : v1 > v2 ? 1 : 0) : (v1 < v2 ? 1 : v1 > v2 ? -1 : 0)
        })
        // sort underlying nodes items
        sorted.forEach(node => node.items = node.items.sort((a, b) => {
            const d1 = sort == 'created' ? a.created : a.updated ?? a.created
            const d2 = sort == 'created' ? b.created : b.updated ?? b.created
            return d1 < d2 ? 1 : d1 > d2 ? -1 : 0
        }))
        // recurse
        sorted.forEach(node => {
            if (node.children.length > 0 && rec)
                node.children = this.recurseSort(node.children, sort)
        })
        return nodes
    }

    sortByDate(items: Item[], sort: ViewSortDate): ViewNode[] {
        let nodes = this.groupByDate(items, sort.date)
        if (sort.secondary == 'cat') {
            nodes = nodes.map(dateNode => this.groupByTopCat(dateNode))
            if (sort.depth != 0) nodes.map(dateNode => {
                return dateNode.children.map(catNode => this.recurseByCat(catNode, 0, sort.depth))
            })
        }

        nodes = this.recurseSort(nodes, sort.date, false, false)
        nodes.forEach(node => node.children = this.recurseSort(node.children, sort.date))

        return this.recurseSort(nodes, sort.date)
    }

    sortByCat(items: Item[], sort: ViewSortCat): ViewNode[] {
        var topNode = this.groupByTopCat({ name: 'top', items: items, children: [] })
        topNode.children.map(catNode => this.recurseByCat(catNode, 0, null))
        if (topNode.items.length > 0)
            topNode.children.push({ name: 'default', items: topNode.items, children: [] })

        return this.recurseSort(topNode.children, sort.date)
    }
}
