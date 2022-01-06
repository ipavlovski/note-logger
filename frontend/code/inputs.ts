// INITIALIZE JSON-SERVER FIRST
// echo '{ "db": [  ] }' > db1.json
// json-server db1.json

import { Item } from 'frontend/code/state/item'
import { v4 as uuidv4 } from "uuid"
import fetch from 'node-fetch'
import { random} from "lodash"

const baseURL = 'http://localhost:3000/db'

// DELETE ALL
async function deleteAll() {
    const all = await fetch(baseURL).then(val => val.json())
    all.db.map(async (v: any) => fetch(`${baseURL}/${v.id}`, { method: 'DELETE' }))
}
deleteAll()

function getCategory(): string[] {
    const cats = [
        ["cat1"], ["cat2"], ["cat3"],
        ["cat1", "subcat1"], ["cat1", "subcat2"],
        ["cat2", "subcat1"], ["cat2", "subcat2"], ["cat2", "subcat3"]
    ]

    return cats[cats.length * Math.random() | 0]
}

function getTags(): string[] {
    const tags = ["tag1", "tag2", "tag3", "tag4", "tag5"]
    const len = 3 * Math.random() | 0
    const dupArr = Array.from({ length: len }).map(_ => tags[tags.length * Math.random() | 0])

    return [...new Set(dupArr)]
}

function getDate(): Date {
    return new Date(Date.now() - random(1000 * 60 * 60 * 24 * 7))
}

function generateMarkdownText(ind: number): string {
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



// generate the text
var genItems: Item[] = Array.from({ length: 100 }).map((_, ind) => {
    return {
        id: uuidv4(),
        meta: {
            header: `Bash-${ind}`,
            category: getCategory(),
            tags: getTags()
        },
        date: { created: getDate(), updated: null, archived: null },
        data: {},
        content: { md: generateMarkdownText(ind), html: null }
    }
})

// insert all the new data
void genItems.map(async (v: any) => fetch(baseURL, {
    method: 'POST',
    body: JSON.stringify(v),
    headers: { 'Content-Type': 'application/json' }
}))


// retrieve data properly (with date conversion)
// @ts-expect-error
var results = await fetch(baseURL).then(v => v.json()).then(v => v.db.map((v: Item) => {
    if (v.date.created) v.date.created = new Date(v.date.created)
    if (v.date.updated) v.date.updated = new Date(v.date.updated)
    if (v.date.archived) v.date.archived = new Date(v.date.archived)
    return v
})) as Item[]

// take a sample of data first
var subset = results.slice(0, 10)
var unique = [...new Set(subset)]

