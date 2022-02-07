import { DB } from 'backend/db'
import View from 'frontend/code/state/view'

describe('View Structure', () => {

    test('basic recursive structure', async () => {
        const db = new DB(':memory:', false)
        await db.init()
        await db.populate('./db-test-main.sqlite')
        var items = await db.queryItems({ type: 'preview' })
        var view = new View()

        var nodes = view.groupByDate(items).map(dateNode => view.groupByTopCat(dateNode))
        nodes.map(dateNode => dateNode.children.map(catNode => view.recurse(catNode, 0, null)))

        expect(nodes[0].name).toEqual('2022-01-05 Wednesday')
        expect(nodes[0].children[1].name).toEqual('catE')
        expect(nodes[0].children[1].children[0].name).toEqual('subEJ')
        expect(nodes[0].children[1].children[0].children[0].name).toEqual('deepEJJ')
        expect(nodes[0].children[1].children[0].children[0].children[0].name).toEqual('superdeepEJJU')
    })
})