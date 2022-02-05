import { DB } from 'backend/db'
import { ItemRow, SqlParams, TagRow } from 'common/types'
import { intersectionBy } from 'lodash'

test('parse tag', () => {
    const builder = new SqlBuilder()

    const tags1 = [[1, 5], [3, 7, 20]]
    const params1 = builder["parseTags"](tags1)
    expect(params1.q).toBe('GROUP BY item.id HAVING COUNT(tag.id IN (?, ?) OR NULL) = ? OR COUNT(tag.id IN (?, ?, ?) OR NULL) = ?')
    expect(params1.args).toStrictEqual([1, 5, 2, 3, 7, 20, 3])

    const tags2 = [[1, 5]]
    const params2 = builder["parseTags"](tags2)
    expect(params2.q).toBe('GROUP BY item.id HAVING COUNT(tag.id IN (?, ?) OR NULL) = ?')
    expect(params2.args).toStrictEqual([1, 5, 2])
})

test('the sum of rec and term cat query lines up', async () => {
    const builder = new SqlBuilder()

    let sqlParams: SqlParams
    const testdb = new DB('db-test-main.sqlite', false)

    sqlParams = builder["parseCategories"]({ rec: [3], term: [] })
    const recItems = await testdb.all<ItemRow>(`SELECT item.id, item.header, output.cat_pid, output.cat_name from item ${sqlParams.q}`, sqlParams.args)
    sqlParams = builder["parseCategories"]({ rec: [], term: [5, 20] })
    const termItems = await testdb.all<ItemRow>(`SELECT item.id, item.header, category.pid, category.name from item ${sqlParams.q}`, sqlParams.args)
    sqlParams = builder["parseCategories"]({ rec: [3], term: [5, 20] })
    const bothItems = await testdb.all<ItemRow>(`SELECT item.id, item.header, output.cat_pid, output.cat_name from item ${sqlParams.q}`, sqlParams.args)

    const xItems = intersectionBy(recItems, termItems, 'id')


    expect(recItems.length + termItems.length - xItems.length).toEqual(bothItems.length)
})

test('basic category and tag inner join', async () => {
    const sqlBuilder = new SqlBuilder()
    const testdb = new DB('db-test-main.sqlite', false)

    const sqlCategories = sqlBuilder["parseCategories"]({ rec: [3], term: [5, 20] })
    const Q = `SELECT item.id, item.header, output.cat_name, tag.id as tagid, 
tag.name as tagname from item
INNER JOIN item_tag ON item.id = item_tag.item_id 
INNER JOIN tag ON tag.id = item_tag.tag_id ${sqlCategories.q}`
    const args = [sqlCategories.args].flat()
    const results = await testdb.all<ItemRow>(Q, args)
    expect(results.length).toBe(52)
})

test('both categories and tag', async () => {
    const sqlBuilder = new SqlBuilder()
    const testdb = new DB('db-test-main.sqlite', false)
    let Q: string

    // categorie and tags
    const sqlCategories = sqlBuilder["parseCategories"]({ rec: [3], term: [5, 20] })
    const sqlTags = sqlBuilder["parseTags"]([[10], [11], [12], [13]])
    Q = `SELECT item.id, item.header, tag.id as tag_id, 
tag.name as tag_name from item
INNER JOIN item_tag ON item.id = item_tag.item_id 
INNER JOIN tag ON tag.id = item_tag.tag_id
${sqlCategories.q} ${sqlTags.q}`
    const args = [sqlCategories.args, sqlTags.args].flat()
    const results = await testdb.all<ItemRow>(Q, args)
    expect(results.length).toBe(11)

    // extract tag susing the IDs
    const ids = results.map(({ id }) => id)
    Q = `SELECT item.id as item_id, tag.id as id, tag.name as name from item
INNER JOIN item_tag ON item.id = item_tag.item_id 
INNER JOIN tag ON tag.id = item_tag.tag_id
WHERE item.id IN (${ids.map(_ => '?').join(',')})`
    const allItemTags = await testdb.all<{ item_id: number } & TagRow>(Q, ids)
    expect(allItemTags.length).toBe(40)

    // ensure that some items have dual tags
    var filteredTags = ids.map(id => allItemTags.filter(v => v.item_id == id))
    const findDualTag = (id1: number, id2: number) => filteredTags.filter(g => g.find(v => v.id == id1) && g.find(v => v.id == id2))
    const itemsWithDualTags = findDualTag(11, 14).map(v => v[0].item_id)
    expect(itemsWithDualTags).toEqual([46, 448])
})

