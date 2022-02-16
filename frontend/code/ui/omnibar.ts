import App from 'frontend/app'
import hotkeys from 'hotkeys-js'
import { DATE_REGEX, DAY_OFFSET_HOURS } from 'common/config'
import { dateParser } from 'common/utils'
import { DateTime } from 'luxon'
import { ViewSort } from 'common/types'

// Omnibar: popup modal to provide a command pallette
// emit events with data as primary source of interaction
// no public methods - all interaction happens through shortcuts
interface Hint {
    header: string
    hints: [string, string][]
}

export default class Omnibar {
    el: HTMLElement
    input: HTMLInputElement
    hint: HTMLDivElement
    hintHeader: HTMLElement
    hintList: HTMLUListElement
    app: App
    saved: [string, string][]
    components: [string, string][]

    constructor(app: App) {
        this.el = document.querySelector(".omnibar-full")!
        this.hintHeader = this.el.querySelector('.hinting-header')!
        this.hintList = this.el.querySelector('.hinting-list')!
        this.hint = this.el.querySelector('.hinting')!
        this.input = document.querySelector(".omnibar-input")!
        this.app = app
        this.saved = app.session.getLocal('saved-searches') ?? []
        this.components = []


        document.addEventListener('click', (event) => {
            if (event.target as HTMLElement == this.el) this.closeOmnibar()
        })

        this.configureShortcuts()
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

        // enter hotkey
        hotkeys('enter', { scope: 'omnibar' }, (event) => {
            event.preventDefault()
            // when pressing enter -> take the string from the input, and 'validate' it
            console.log('pressed enter')
        })

        hotkeys('escape', { scope: 'omnibar' }, (event) => {
            event.preventDefault()
            this.closeOmnibar()
        })

        hotkeys('tab', { scope: 'omnibar' }, (event) => {
            event.preventDefault()

            console.log('TAB!')

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



    private showHint(hint: Hint) {
        this.hintHeader.innerHTML = ""
        this.hintList.innerHTML = ""

        // header
        this.hintHeader.innerHTML = `<b>${hint.header}</b>`

        // hints
        hint.hints.map(([title, desc]) => {
            const li = document.createElement('li')
            li.innerHTML = `<b>${title}</b> ${desc}`
            this.hintList.appendChild(li)
        })
    }



    private parseOmnibarInput(input: string): Hint {

        if (/^#.*/.test(input)) {
            const hint = this.handleCommandInput(input)
            return hint
        }

        const primaryKeyPairs: [string, string][] = [
            ['sort-by:', 'sorting string'],
            ['archived:', 'true/false'],
            ['created:', 'date expression'],
            ['updated:', 'date expression'],
            ['search:', 'search-string'],
            ['saved:', 'saved vals'],
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
            case 'sort-by:': hint = this.getSortSuggestions(match[2]); break
            case 'archived:': hint = this.getArchivedSuggestions(match[2]); break
            case 'created:': hint = this.getDateSuggestions(match[2]); break
            case 'updated:': hint = this.getDateSuggestions(match[2]); break
            case 'search:': hint = this.getSearchSuggestions(match[2]); break
            case 'saved:': hint = this.getSavedSuggestions(match[2]); break
            case 'cats:': hint = this.getCatSuggestions(match[2]); break
            case 'tags:': hint = this.getTagSuggestions(match[2]); break
            default: hint = { header: 'Unmatched key got through', hints: [] }
        }
        return hint
    }



    private getSavedSuggestions(inputStr: string): Hint {

        const hints: [string, string][] = [
            ['saved one', 'one'],
            ['saved two', 'two']
        ]

        return {
            header: 'Handling saved searches',
            hints: hints
        }
    }


    private getSortSuggestions(inputStr: string): Hint {

        const hints: [string, string][] = [
            ["by:", "date (default) | cat"],
            ["depth:", "null (default) or number"],
            ["updated", "false (default) or true"]
        ]
        const split = inputStr.split(',')
        const output: string[] = []

        if (split.length < 1 || !(['date', 'cat'].includes(split[0]))) {
            return { header: 'e.g.: "date"    "cat,2"    "date,null,true"', hints: hints }
        } else {
            output.push(`by=${split[0]}`)
        }

        if (split.length >= 2 && (parseInt(split[1]) >= 0 || split[1] == 'null')) {
            output.push(`depth=${split[1]}`)
        }

        if (split.length >= 3 && (['true', 'false'].includes(split[2]))) {
            output.push(`updated=${split[2]}`)
        }

        return {
            header: output.join(' '),
            hints: hints
        }
    }

    private getDateSuggestions(inputStr: string): Hint {

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
        if (!(valStart && valEnd)) return { header: 'Improper date formatting', hints: examples }

        const results = dateParser([start, end])
        const isoStart = DateTime.fromSeconds(results[0])
            .toISO({ suppressMilliseconds: true, suppressSeconds: true, includeOffset: false })
        const isoEnd = DateTime.fromSeconds(results[1])
            .toISO({ suppressMilliseconds: true, suppressSeconds: true, includeOffset: false })

        return {
            header: `${isoStart} - ${isoEnd}`,
            hints: examples
        }
    }

    private getSearchSuggestions(inputStr: string): Hint {
        return { header: `search string: ${inputStr}`, hints: [] }
    }

    private getArchivedSuggestions(inputStr: string): Hint {
        const header = (inputStr == 'true' || inputStr == 'false') ? inputStr : ''
        const hints: [string, string][] = [['', 'true'], ['', 'false']]
        return { header, hints }

    }


    private getTagSuggestions(inputStr: string): Hint {
        const tagGroups = inputStr.split(',').map(v => v.split('+'))
        const allTags = this.app.session.meta.tags
        const filtered = tagGroups.map(group =>
            group.filter(tagName => allTags.find(tag => tag.name == tagName)))
        return {
            header: filtered.map(group => group.join('+')).join(', '),
            hints: allTags.map((v) => ['', v.name])
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

        return {
            header: walkChain.map(v => v.name).join(' > '),
            hints: suggestions
        }
    }




    private handleCommandInput(inputStr: string): Hint {
        const hints: [string, string][] = [
            ['#last', 'insert the last command into omnibar'],
            ['#save', 'save the current command into array'],
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


