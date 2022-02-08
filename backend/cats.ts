import { CategoryLeaf } from 'common/types'

// RECURSIVE CATEGORY TREE
class CatTree {
    tree: CategoryLeaf[]
    constructor(input: CategoryLeaf[]) {
        this.tree = this.buildCatTree(input)
    }

    private buildCatTree(input: CategoryLeaf[]) {
        const recurse = ((root: CategoryLeaf) => {
            root.children = input.filter(v => v.pid == root.id)
            if (root.children.length > 0) root.children.map(recurse)
            return root
        })
        return input.filter(v => v.pid == null).map(recurse)
    }

    get(id: number) {
        let result: CategoryLeaf[]
        const recurse = (id: number, tree: CategoryLeaf[], acc: CategoryLeaf[]) => {
            for (const leaf of tree) {
                if (leaf.id == id) result = acc.concat(leaf)
                if (leaf.children.length > 0) recurse(id, leaf.children, acc.concat(leaf))
            }
        }
        recurse(id, this.tree, [])
        return result!
    }
}
// var allCats = await testdb.all<CategoryLeaf>(`select * from category`, [])
// var catTree = new CatTree(allCats)
// catTree.get(275)
// catTree.tree[3].children[2].children[1].children[3].id;



