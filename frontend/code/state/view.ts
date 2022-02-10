// Basic methods:
// - create/init: flat item array into view
// - flatten/summary: take the view, linearize it (embed level #)
// - append: add a new set of items to the current view (paging)
// - resort: apply a different sorting to the set of items
// - add/update/remove node: modify individual nodes
// - findById: get the element based on the id

import { FlatNode, Item, ViewNode, ViewSort } from 'common/types'
import { DateTime } from 'luxon'


export default class View {
    nodes: ViewNode[]

    constructor(items: Item[], sort: ViewSort) {
        this.nodes = sort.by == 'date' ? this.sortByDate(items, sort) : this.sortByCat(items, sort)
    }

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
    groupByDate(items: Item[], useUpdated: boolean) {
        return items.reduce((acc: ViewNode[], item: Item) => {
            const date = useUpdated ? (item.updated ?? item.created) : item.created
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


    flatten() {
        const acc: FlatNode[] = []
        const recurse = (node: ViewNode, level: number, parents: string[]) => {
            const section = parents.concat(node.name)
            acc.push({ 
                type: 'section', section: section, parent: parents[parents.length - 1], level
             })
            node.items.forEach(item => {
                acc.push({ type: 'item', item: item, parent: node.name, level })
            })
            if (node.children.length > 0)
                node.children.forEach(childNode => 
                    recurse(childNode, level + 1, section))
        }
        this.nodes.forEach(topNode => recurse(topNode, 0, ['top']))
        acc.forEach(flatNode => {
            if (flatNode.type == 'section') {
                flatNode.section = flatNode.section.slice(1)
            }
        })
        return acc
    }

    recurseSort(nodes: ViewNode[], useUpdated: boolean, asc = true, rec = true) {
        // sort this levels nodes
        const sorted = nodes.sort((a, b) => {
            const v1 = a.name.toUpperCase()
            const v2 = b.name.toUpperCase()
            return asc ? (v1 < v2 ? -1 : v1 > v2 ? 1 : 0) : (v1 < v2 ? 1 : v1 > v2 ? -1 : 0)
        })
        // sort underlying nodes items
        sorted.forEach(node => node.items = node.items.sort((a, b) => {
            const d1 = useUpdated ? (a.updated ?? a.created) : a.created
            const d2 = useUpdated ? (b.updated ?? b.created) : b.created
            return d1 < d2 ? 1 : d1 > d2 ? -1 : 0
        }))
        // recurse
        sorted.forEach(node => {
            if (node.children.length > 0 && rec)
                node.children = this.recurseSort(node.children, useUpdated)
        })
        return nodes
    }

    sortByDate(items: Item[], sort: ViewSort): ViewNode[] {
        const useUpdated = sort.useUpdated ?? false
        let nodes = this.groupByDate(items, useUpdated)

        if (sort.depth == null || sort.depth > 0)
            nodes = nodes.map(dateNode => this.groupByTopCat(dateNode))

        if (sort.depth == null || sort.depth > 1) nodes.map(dateNode => {
            const depth = sort.depth == null ? null : sort.depth - 1
            return dateNode.children.map(catNode => this.recurseByCat(catNode, 0, depth))
        })

        nodes = this.recurseSort(nodes, useUpdated, false, false)
        nodes.forEach(node => node.children = this.recurseSort(node.children, useUpdated))

        return nodes
    }

    sortByCat(items: Item[], sort: ViewSort): ViewNode[] {
        const useUpdated = sort.useUpdated ?? false
        const topNode = this.groupByTopCat({ name: 'top', items: items, children: [] })
        if (sort.depth != 0)
            topNode.children.map(catNode => this.recurseByCat(catNode, 0, sort.depth))

        if (topNode.items.length > 0)
            topNode.children.push({ name: 'default', items: topNode.items, children: [] })

        return this.recurseSort(topNode.children, useUpdated)
    }
}
