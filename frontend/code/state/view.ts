// VIEW
// the class that describes the representation of the categorized items
// interaction with the state of the view

// cat:
import { CatItem, CatMap, Item, ItemFactory } from 'frontend/code/state/item'

export interface SortingOptions {
    sortBy: 'date' | 'category'
    subsort: 'date' | 'name'
    maxLevel?: number
}

export interface ItemSummary {
    type: 'catitem' | 'item'
    name: string
    cat: string[]
    item?: Item
    children?: number
}

// TODO: finally setup the editor + content + sidebar + preview (with scrollbars)
// TODO: properly convert itesm from DB (parse dates)
// TODO: setup server to exec shell commands and do fuzzy-regex, instead of json-server
export class View {

    private catMap: CatMap
    private sortOpts: SortingOptions

    constructor(items: Item[], sortOpts: SortingOptions) {
        this.sortOpts = sortOpts
        this.catMap = this.categorizeItems(items, this.sortOpts)
    }

    // get all the items
    all() {
        return this.catMap.size
    }

    total(): number {
        return null
    }

    // the 'view' will have order at some point
    // push the item into the order, return the ID
    // do we really need the ID?
    push(item: Item): void {
    }

    // get item by ID
    getItemByID(id: string): Item {
        return null
    }

    getContent() {

    }

    private getOrCreateCatItem(parent: CatMap, cats: string[]): CatItem {
        let catItem: CatItem
        const catItems = cats.reduce((col: CatMap, cat: string): CatMap => {
            catItem = col.has(cat) ? col.get(cat) : col.set(cat, ItemFactory.catItem(cat)).get(cat)
            return catItem.subcat
        }, parent)
        return catItem
    }


    private recursiveSort(catMap: CatMap, opts: SortingOptions) {
        // create a copy of the input
        // sort the main level
        const map = new Map([...catMap.entries()].sort((a, b) => b[0].localeCompare(a[0])))

        // resort the items by date
        map.forEach(catItem => {
            catItem.items = catItem.items.sort((item1, item2) => {
                if (opts.subsort == 'date') 
                    return item2.date.created.valueOf() - item1.date.created.valueOf()
                if (opts.subsort == 'name') 
                    return item2.meta.header.localeCompare(item1.meta.header)
            })
        })

        // resort categories by name
        map.forEach(catItem => {
            if (catItem.subcat.size > 0) {
                catItem.subcat = new Map([...catItem.subcat.entries()].sort())
                this.recursiveSort(catItem.subcat, opts)
            }
        })

        return map
    }



    private categorizeItems(items: Item[], opts: SortingOptions) {
        const catMap: CatMap = new Map<string, CatItem>()

        items.forEach(item => {
            let cats: string[]
            if (opts.sortBy == 'category') {
                cats = item.meta.category.length > 0 ? item.meta.category : ["default"]
                if (opts.maxLevel > 0) cats = cats.slice(0, opts.maxLevel)
            }
            if (opts.sortBy == 'date') {
                cats = [item.date.created.toLocaleDateString()]
                if (opts.maxLevel > 0) cats = cats.concat(item.meta.category.slice(0, opts.maxLevel))
            }

            const catItem = this.getOrCreateCatItem(catMap, cats)
            catItem.items.push(item)
        })

        return this.recursiveSort(catMap, opts)
    }


    private recursiveSummary(catMap: CatMap, cat: string[], collector: ItemSummary[]) {
        catMap.forEach(catItem => {
            const catChain = cat.concat(catItem.cat)
            collector.push({
                type: "catitem",
                name: catItem.cat,
                cat: catChain,
                children: catItem.items.length
            })
            catItem.items.forEach(item => {
                // TODO -> if header is null, extract it from md/html
                collector.push({
                    type: "item",
                    name: item.meta.header,
                    cat: catChain,
                    item: item
                })
            })
            if (catItem.subcat.size > 0) {
                this.recursiveSummary(catItem.subcat, catChain, collector)
            }
        })

        return collector
    }

    flatten() {
        return this.recursiveSummary(this.catMap, [], [])
    }





}
