import { existsSync, unlinkSync } from 'fs'
import { random, range, sample, sampleSize } from 'lodash'
import { DateTime } from 'luxon'
import MarkdownIt from 'markdown-it'
import 'common/seed'
import { Item } from 'common/types'
import { DBTest } from 'tests/_classes'

class Generator {
    categories: string[][]
    tags: string[]
    md

    constructor(catSize?: [number, number, number, number], tagSize?: number) {
        const defaultTagSize = tagSize ?? 20
        const defaultCatSize = catSize ?? [3, 4, 5, 6]

        this.md = new MarkdownIt()
        this.categories = this.buildCategoryList(defaultCatSize)
        this.tags = this.buildTagList(defaultTagSize)
    }

    protected buildTagList(tagSize: number) {
        return Array.from({ length: tagSize }).map((_, ind) => `tag${ind}`)
    }

    protected buildCategoryList(sizes?: [number, number, number, number]) {
        const letters = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        const acc: string[][] = []
        for (const i of sampleSize(letters, random(1, sizes[0]))) {
            const cat = `cat${i}`
            acc.push([cat])
            for (const j of sampleSize(letters, random(1, sizes[1]))) {
                const sub = `sub${i}${j}`
                acc.push([cat, sub])
                for (const k of sampleSize(letters, random(1, sizes[2]))) {
                    const deep = `deep${i}${j}${k}`
                    acc.push([cat, sub, deep])
                    for (const l of sampleSize(letters, random(1, sizes[3]))) {
                        const superdeep = `superdeep${i}${j}${k}${l}`
                        acc.push([cat, sub, deep, superdeep])
                    }
                }
            }
        }
        return acc
    }


    genTags(size: number): string[] {
        return sampleSize(this.tags, size)
    }

    genCategories() {
        return sample(this.categories)
    }

    genDate() {
        return DateTime.now().minus({
            days: random(30),
            hours: random(24),
            minutes: random(59),
            seconds: random(59)
        })
    }


    genMD(ind: number): string {
        var tilde = '```'

        return `
### BASH script - #${ind}

${tilde}bash
#! /bin/bash

## some other interesting classes:
## Thunar: 'File Manager'

## shortcut-1 is type: primary/secondary
## shortcut-2 is key: z/x/c/v
## an example of a shortcut: primary-x
shortcut="\${1}-\${2}"

## space refers to the active space
workspace=$(wmctrl -d | grep "*" | cut -d" " -f1)


## example: wm_open_window Chromium
function wm_open_window() {
        local app="$1"
        local space="$2"

        match=$(wmctrl -xl | grep -E "^.{12}\${space}.*\${app}")

        if [[ ! -z "$match" ]]; then
                wmctrl -i -R "\${match:0:10}"
        else
                notify-send "wm-open" "No window open for \${app}"
        fi
}
${tilde}
`
    }

    genHeader(ind: number) {
        return `Bash-${ind}`
    }

    genHTML(text: string) {
        return this.md.render(text)
    }


    genItems(size: number, maxTags: number) {
        if (size < 1) return null
        const inds = range(1, size)
        return inds
        // return inds.map(ind => this.genItem(ind, random(maxTags)))
    }

    async genDatabase(db: DBTest, itemSize: number) {
        const maxTagsPerItem = 6

        // insert categories
        for await (const chain of this.categories) {
            // await db.getOrCreateCategory(chain)
        }

        // insert tags
        for await (const tag of this.tags) await db.getOrCreateTag(tag)

        // create multiple items
        const items = this.genItems(itemSize, maxTagsPerItem)
        // for await (const item of items) await db.insertItem(item)
    }
}








test('DB generator actually works', async () => {
    const filename = './db-test-test.sqlite'
    const gen = new Generator()
    const testdb = new DBTest({ filename: filename, rebuild: true, debug: false })
    await gen.genDatabase(testdb, 10)

    expect(existsSync(filename)).toBeTruthy()
    const count = await testdb.get<{ count: number }>('select count(*) as count from category', [])

    expect(count.count).toBe(10)

    if (existsSync(filename)) unlinkSync(filename)

})


// PARAMS TO GENERATE THE DATABASE
// -----------------------------
// const gen = new Generator([6, 6, 6, 6], 20)
// const testdb = new DBTest({ filename: './db-test-main.sqlite' })
// await gen.genDatabase(testdb, 500)    
test('check params of the main test-DB', async () => {
    const testdb = new DBTest({ filename: './db-test-main.sqlite', rebuild: false, debug: false })

    const catResult = await testdb.get<{ count: number }>('select count(*) as count from category', [])
    const itemResult = await testdb.get<{ count: number }>('select count(*) as count from item', [])

    expect(catResult.count).toBe(300)
    expect(itemResult.count).toBe(499)

})


// PRIOR TO DOING THIS, NEED TO GENERATE 2 FILES SEPARATELY
// 2 files: ./db-test-1.sqlite and ./db-test-2.sqlite
// ----------------------------------------
// import Generator from 'tests/generator'
// import DBTest from 'tests/db'
// const gen = new Generator([2, 2, 2, 2], 5)
// const testdb = new DBTest({ filename: './db-test-2.sqlite' })
// await gen.genDatabase(testdb, 10)
test('test DB generator seed equality', async () => {

    const testdb1 = new DBTest({ filename: './db-test-1.sqlite', rebuild: false, debug: false })
    const testdb2 = new DBTest({ filename: './db-test-2.sqlite', rebuild: false, debug: false })

    const count1 = await testdb1.get<{ count: number }>('select count(*) as count from category', [])
    console.log('COUNT1:', count1)
    const count2 = await testdb2.get<{ count: number }>('select count(*) as count from category', [])
    console.log('COUNT2:', count2)

    expect(count1.count).toBe(count2.count)
}, 10000)