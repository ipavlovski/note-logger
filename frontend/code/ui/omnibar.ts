import { DATE_REGEX } from 'common/config'
import { CatQuery, Query, TagQuery, TagRow, ViewSort } from 'common/types'
import { dateParser } from 'common/utils'
import App from 'frontend/app'
import hotkeys from 'hotkeys-js'
import { DateTime } from 'luxon'

interface Hint {
    header: string
    hints: [string, string][]
    key?: string
    value?: Omit<Query, 'type'> | null
    sort?: ViewSort
}

export default class Omnibar {
    app: App
    el: HTMLElement
    input: HTMLInputElement
    saved: [string, string][]
    validHints: [string, Hint][]

    constructor(app: App) {
        this.app = app
        this.el = document.querySelector(".omnibar-full")!
        this.input = document.querySelector(".omnibar-input")!
        this.saved = app.session.getLocal('saved-searches') ?? []
        this.validHints = []

        this.configureEvents()
        this.configureShortcuts()
    }

    private configureEvents() {
        document.addEventListener('click', (event) => {
            if (event.target as HTMLElement == this.el) this.closeOmnibar()
        })
    }

    private configureShortcuts() {
        hotkeys.setScope('main')

        hotkeys('/', { scope: 'main' }, (event, handler) => {
            event.preventDefault()
            this.openOmnibar()
        })

        hotkeys('/', { scope: 'omnibar' }, (event, handler) => {
            event.preventDefault()
            this.closeOmnibar()
        })

        hotkeys('escape', { scope: 'omnibar' }, (event) => {
            event.preventDefault()
            this.closeOmnibar()
        })

        hotkeys('tab', { scope: 'omnibar' }, (event) => {
            event.preventDefault()

            console.log('TAB!')

        })


        hotkeys('ctrl+enter', { scope: 'omnibar' }, (event) => {
            event.preventDefault()
            this.showResults()

        })

        hotkeys('enter', { scope: 'omnibar' }, (event) => {
            event.preventDefault()
            const hint = this.parseOmnibarInput(this.input.value)

            if ((hint.value || hint.sort) && hint.key != '') {
                this.validHints.push([this.input.value, hint])
                this.input.value = ''
            } else {
                this.wiggle()
            }
        })

        hotkeys.filter = (event: Event) => {
            const tagName = (event.target as HTMLElement).tagName
            if (hotkeys.getScope() == 'omnibar' && event.target == this.input) {
                if (event.type == 'keyup') {
                    // console.log(`${(event as KeyboardEvent).key} @ ${event.type} was pressed!`)
                    const hint = this.parseOmnibarInput(this.input.value)
                    this.showHint(hint!)
                }

                return true
            }
            if (tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA') return false
            if (hotkeys.getScope() == 'main') return true
            return false
        }
    }


    private wiggle() {
        this.input.classList.add('wiggle')
        setTimeout(() => this.input.classList.remove('wiggle'), 250)
    }

    private openOmnibar() {
        this.el.style.display = "block"
        hotkeys.setScope('omnibar')
        console.log('Scope set:', hotkeys.getScope())
        this.input.focus()
    }

    private closeOmnibar() {
        hotkeys.setScope('main')
        console.log('Scope set:', hotkeys.getScope())
        this.el.style.display = "none"
    }


    private showResults() {
        // clone the object first
        const hints = [...this.validHints]
        const ind = hints.findIndex(([, hint]) => hint.key == 'sort:')
        const sort = (ind != -1) ? hints.splice(ind, 1)[0][1].sort! : null

        const query: Query = hints.length == 0 ? null :
            Object.assign({ type: 'full' }, ...hints.map(v => v[1].value))

        this.closeOmnibar()

        // display the contents of the query
        this.app.session.updateContent(query, sort)

        // reset the sort
        this.validHints = []
    }


    private showHint(hint: Hint) {
        const hintSelected: HTMLHeadElement = this.el.querySelector('.hinting-selected')!
        const hintValidated: HTMLUListElement = this.el.querySelector('.hinting-validated')!
        const hintHeader: HTMLHeadElement = this.el.querySelector('.hinting-header')!
        const hintList: HTMLUListElement = this.el.querySelector('.hinting-list')!

        hintSelected.innerHTML = ""
        hintValidated.innerHTML = ""
        hintHeader.innerHTML = ""
        hintList.innerHTML = ""

        if (this.validHints.length > 0) {
            this.validHints.forEach(([, hint]) => {
                const li = document.createElement('li')
                li.innerHTML = `<b>${hint.key}</b> ${hint.header}`
                hintValidated.appendChild(li)
            })
        }

        // header
        hintHeader.innerHTML = `<b>${hint.header}</b>`

        // hints
        hint.hints.map(([title, desc]) => {
            const li = document.createElement('li')
            li.innerHTML = `<b>${title}</b> ${desc}`
            hintList.appendChild(li)
        })
    }



    private parseOmnibarInput(input: string): Hint {

        if (/^#.*/.test(input)) {
            const hint = this.handleCommandInput(input)
            return hint
        }

        const primaryKeyPairs: [string, string][] = [
            ['sort:', 'sorting string'],
            ['saved:', 'saved vals'],
            ['archived:', 'true/false'],
            ['created:', 'date expression'],
            ['updated:', 'date expression'],
            ['search:', 'search-string'],
            ['cats:', 'cat1>cat2>cat3,catN>catJ$'],
            ['tags:', 'tag1+tag2,tag3,tag4'],
            ['#', 'execute command']
        ]

        var primaryKeys = primaryKeyPairs.map(v => v[0])
        var match = input.match(/(^.*?:)(.*$)/)
        if (match == null || !primaryKeys.find(v => v == match![1])) {
            const hint = { header: 'No keyword match.', hints: primaryKeyPairs }
            return hint
        }

        let hint: Hint
        switch (match![1]) {
            case 'sort:': hint = this.getSortSuggestions(match[2]); break
            case 'saved:': hint = this.getSavedSuggestions(match[2]); break
            case 'archived:': hint = this.getArchivedSuggestions(match[2]); break
            case 'created:': hint = this.getDateSuggestions(match[2], match![1]); break
            case 'updated:': hint = this.getDateSuggestions(match[2], match![1]); break
            case 'search:': hint = this.getSearchSuggestions(match[2]); break
            case 'cats:': hint = this.getCatSuggestions(match[2]); break
            case 'tags:': hint = this.getTagSuggestions(match[2]); break
            default: hint = { header: 'Unmatched key got through', hints: [] }
        }
        hint.key = match![1]
        return hint
    }



    private getSavedSuggestions(inputStr: string): Hint {

        const hints: [string, string][] = [
            ['saved one', 'one'],
            ['saved two', 'two']
        ]

        return {
            header: 'Handling saved searches',
            hints: hints,
            key: ''
        }
    }


    private getSortSuggestions(inputStr: string): Hint {

        const hints: [string, string][] = [
            ["by:", "date (default) | cat"],
            ["depth:", "null (default) or number"],
            ["updated", "false (default) or true"]
        ]
        const split = inputStr.split(',')
        const header: string[] = []
        const sort: ViewSort = { by: 'date', depth: null }

        if (split.length < 1 || !(['date', 'cat'].includes(split[0]))) {
            return { header: 'e.g.: "date"  "cat,2"  "date,null,true"', hints: hints, key: '' }
        } else {
            header.push(`by=${split[0]}`)
            sort.by = split[0] as 'date' | 'cat'
        }

        if (split.length >= 2 && (parseInt(split[1]) >= 0 || split[1] == 'null')) {
            header.push(`depth=${split[1]}`)
            sort.depth = split[1] == 'null' ? null : parseInt(split[1])
        }

        if (split.length >= 3 && (['true', 'false'].includes(split[2]))) {
            header.push(`updated=${split[2]}`)
            sort.useUpdated = JSON.parse(split[2])
        }

        return {
            header: header.join(' '),
            hints: hints,
            sort: sort
        }
    }

    private getDateSuggestions(inputStr: string, key: string): Hint {

        const examples: [string, string][] = [
            ["shorthand", "1d, 3w, 2m, 4y"],
            ["date", "2011, 2011-12, 2011-12-14"],
            ["start/end", "2011 - 1d"],
            ["date/date", "2015 - 2016"]
        ]

        const split = inputStr.split(' - ')
        const start = split[0]
        const end = split[1]

        const [wordRegex, numRegex] = DATE_REGEX

        const valStart = start.match(wordRegex) || start.match(numRegex)
        const valEnd = (end != null) ? (end.match(wordRegex) || end.match(numRegex)) : true
        if (!(valStart && valEnd)) return {
            header: 'Improper date formatting',
            hints: examples,
            value: null
        }

        const results = dateParser([start, end])
        const isoStart = DateTime.fromSeconds(results[0])
            .toISO({ suppressMilliseconds: true, suppressSeconds: true, includeOffset: false })
        const isoEnd = DateTime.fromSeconds(results[1])
            .toISO({ suppressMilliseconds: true, suppressSeconds: true, includeOffset: false })


        const value: Pick<Query, 'created'> | Pick<Query, 'updated'> = (key == 'created:') ?
            ({ created: end == null ? [start, null] : [start, end] }) :
            ({ updated: end == null ? [start, null] : [start, end] })

        return {
            header: `${isoStart} - ${isoEnd}`,
            hints: examples,
            value: value
        }
    }

    private getSearchSuggestions(inputStr: string): Hint {
        const value = inputStr == '' ? null : inputStr
        return {
            header: `${inputStr}`,
            hints: [],
            value: value != null ? { search: { body: value, header: value } } : null
        }
    }

    private getArchivedSuggestions(inputStr: string): Hint {
        const header = (inputStr == 'true' || inputStr == 'false') ? inputStr : ''
        const hints: [string, string][] = [['', 'true'], ['', 'false']]

        const value: boolean = (header == '') ? null : JSON.parse(header)

        return {
            header,
            hints,
            value: value != null ? { archived: value } : null
        }

    }


    private getTagSuggestions(inputStr: string): Hint {
        const tagGroups = inputStr.split(',').map(v => v.split('+'))
        const allTags = this.app.session.meta.tags


        let unmatched = false
        const filtered: TagQuery = tagGroups.map(group => {
            const groupTags = group.map(tagName => allTags.find(tag => tag.name == tagName))
            const filteredTags = groupTags.filter(tagRow => tagRow != null) as TagRow[]
            if (groupTags.length != filteredTags.length) unmatched = true
            return filteredTags
        })

        const value: TagQuery | undefined =
            (unmatched || filtered.map(v => v.length).some(v => v == 0)) ? undefined : filtered

        return {
            header: filtered.map(group => group.map(v => v.name).join('+')).join(', '),
            hints: allTags.map((v) => ['', v.name]),
            value: value != null ? { tags: value } : null
        }
    }

    private getCatSuggestions(inputStr: string): Hint {
        const catTree = this.app.session.meta.catTree
        const commaSplit = inputStr.split(',')
        const catSplit = commaSplit[commaSplit.length - 1].split('>')
        catSplit[catSplit.length - 1] = catSplit[catSplit.length - 1].split('$')[0]

        const walkChain = catTree.walk(catSplit)
        const nodes = (walkChain.length == 0) ? catTree.tree :
            walkChain.reduce((acc, curr) => acc.find(v => v.name == curr.name)?.children!, catTree.tree)

        const suggestions = nodes.map((v): [string, string] => {
            const name = v.name
            const subcats = v.children.length == 0 ? '-' : v.children.map(c => c.name).join(', ')
            return [name, subcats]
        })


        let value: CatQuery | undefined = { term: [], rec: [] }
        try {
            inputStr.split(',').map(group => group.split('>')).map(chain => {
                if (chain.length == 0) throw new Error()
                const isTerm = /.*\$$ /.test(chain[chain.length - 1])
                if (isTerm) chain[chain.length - 1] = chain[chain.length - 1].split('$')[0]
                const walk = catTree.walk(chain)
                if (walk.length != chain.length) throw new Error()
                isTerm ? value?.term.push(walk[walk.length - 1]) :
                    value?.rec.push(walk[walk.length - 1])
            })
        } catch {
            value = undefined
        }

        return {
            header: walkChain.map(v => v.name).join(' > '),
            hints: suggestions,
            value: value != null ? { cats: value } : null
        }
    }




    private handleCommandInput(inputStr: string): Hint {
        const hints: [string, string][] = [
            ['#last', 'insert the last command into omnibar'],
            ['#save', 'save the current command into array'],
            ['#clear', 'clear the current input'],
            ['#deselect', 'deselect all currently selected items'],
            ['#switch-session', 'change the session'],
            ['#rename-tag', 'rename tag-name1->tag-name2'],
            ['#rename-cat', 'rename cat-chain1->cat-chain2']
        ]
        return {
            header: 'Handling command output',
            hints: hints
        }
    }

    private inputCommandSave(input: string) {
        // get them from the input
        const name = 'some name...'
        const value = 'some values...'

        this.saved?.push([name, value])
        this.app.session.setLocal('saved-searches', this.saved)
    }




}


