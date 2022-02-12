import CatTree from 'backend/cats'
import { DB } from 'backend/db'
import { CatNode } from 'common/types'

test('test the cat tree build and walk', async () => {
    var db = new DB(':memory:', false)
    await db.init()
    await db.populate('./db-test-main.sqlite')

    var allCats = await db.all<CatNode>(`select * from category`, [])
    var catTree = new CatTree(allCats)

    expect(
        catTree.walk(['catZ', 'subZO', 'deepZOS'])
    ).toHaveLength(3)

    expect(
        catTree.walk(['catZ', 'subZO', 'deepZOS2!', 'lol!'])
    ).toHaveLength(4)

    expect(
        catTree.walk(['catZ', 'subZO', 'deepZOS2', 'lol'])
    ).toHaveLength(2)
})