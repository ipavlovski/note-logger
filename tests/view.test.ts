import { DB } from 'backend/db'
import View from 'frontend/code/state/view'

describe('View Structure', () => {

    test('basic recursive structure', async () => {
        const db = new DB(':memory:', false)
        await db.init()
        await db.populate('./db-test-main.sqlite')
        var items = await db.queryItems({ type: 'preview' })
        
        var view = new View(items, { by: 'cat', depth: null, useUpdated: false})
        var view = new View(items, { by: 'cat', depth: 1, useUpdated: false})
        var view = new View(items, { by: 'date', depth: null, useUpdated: false})
        var view = new View(items, { by: 'date', depth: 3, useUpdated: false})
                
        expect(view.nodes[0].name).toEqual('2022-01-05 Wednesday')
        expect(view.nodes[0].children[1].name).toEqual('catE')
        expect(view.nodes[0].children[1].children[0].name).toEqual('subEJ')
        expect(view.nodes[0].children[1].children[0].children[0].name).toEqual('deepEJJ')
        expect(view.nodes[0].children[1].children[0].children[0].children[0].name).toEqual('superdeepEJJU')
    })
})