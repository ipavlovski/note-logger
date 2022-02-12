import { CatNode, CatRow } from 'common/types'

// RECURSIVE CATEGORY TREE
export default class CatTree {
    tree: CatNode[]
    constructor(catRows: CatRow[]) {
        // the basic input will get assigned 'children'
        // so CatRow[] -> CatNode[] will be 'autoconverted' naturally
        const input = catRows as CatNode[]
        this.tree = this.buildCatTree(input)
    }

    private buildCatTree(input: CatNode[]) {
        const recurse = ((root: CatNode) => {
            root.children = input.filter(v => v.pid == root.id)
            if (root.children.length > 0) root.children.map(recurse)
            return root
        })
        return input.filter(v => v.pid == null).map(recurse)
    }

    get(id: number) {
        let result: CatNode[]
        const recurse = (id: number, tree: CatNode[], acc: CatNode[]) => {
            for (const leaf of tree) {
                if (leaf.id == id) result = acc.concat(leaf)
                if (leaf.children.length > 0) recurse(id, leaf.children, acc.concat(leaf))
            }
        }
        recurse(id, this.tree, [])
        return result!
    }

    walk(catNames: string[]) {
        let tree = this.tree
        const cats: CatRow[] = []
        for (let ind = 0; ind < catNames.length; ind++) {
            const catName = catNames[ind]
            const match = tree.find(v => v.name == catName)
            if (match == null && /!$/.test(catName)) {
                cats.push({ id: null, pid: null, name: catName.slice(0, -1) })
                tree = []
            } else if (match == null && ! /!$/.test(catName)) {
                return cats
            } else {
                const { id, pid, name, children } = match!
                cats.push({ id, pid, name })
                tree = children
            }
        }
        return cats
    }
}



