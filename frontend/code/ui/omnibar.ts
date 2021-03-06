import { DATE_REGEX } from 'common/config'
import { CatQuery, Query, TagQuery, TagRow, ViewSort } from 'common/types'
import { dateParser } from 'common/utils'
import App from 'frontend/app'
import hotkeys from 'hotkeys-js'
import { DateTime } from 'luxon'

interface Hint {
    header: string
    hints: [string, string][]
}

interface OmniInput {
    key: [string, string]
    hint: (input: string) => Hint
    action: (input: string) => boolean
}

type OmniCollection = {
    query: OmniInput[],
    commands: OmniInput[],
    sort: OmniInput[]
}

interface QueryProp {
    key: string
    input: string
    value: Partial<Query>
}

interface QuickAccessState {
    queryProps: QueryProp[]
    sort: ViewSort
}

class CatInput implements OmniInput {
    key: [string, string] = ['cat', 'cat1>cat2>cat3,catN>catJ$']

    hint(this: Omnibar, input: string): Hint {
        input = input ?? ''
        const catTree = this.app.session.meta.catTree
        const commaSplit = input.split(',')
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

    action(this: Omnibar, input: string): boolean {
        input = input ?? ''
        const catTree = this.app.session.meta.catTree
        let value: CatQuery | undefined = { term: [], rec: [] }

        try {
            input.split(',').map(group => group.split('>')).map(chain => {
                if (chain.length == 0) throw new Error()
                const isTerm = /.*\$$ /.test(chain[chain.length - 1])
                if (isTerm) chain[chain.length - 1] = chain[chain.length - 1].split('$')[0]
                const walk = catTree.walk(chain)
                if (walk.length != chain.length) throw new Error()
                isTerm ? value?.term.push(walk[walk.length - 1]) :
                    value?.rec.push(walk[walk.length - 1])
            })
            const output: QueryProp = { key: 'cat', input, value: { cats: value } }
            this.queryProps.push(output)
            return true
        } catch {
            return this.wiggle()
        }

    }



}



class TagInput implements OmniInput {
    key: [string, string] = ['tag', 'tag1+tag2,tag3,tag4']


    hint(this: Omnibar, input: string): Hint {
        input = input ?? ''
        const tagGroups = input.split(',').map(v => v.split('+'))
        const allTags = this.app.session.meta.tags

        let unmatched = false
        const filtered: TagQuery = tagGroups.map(group => {
            const groupTags = group.map(tagName => allTags.find(tag => tag.name == tagName))
            const filteredTags = groupTags.filter(tagRow => tagRow != null) as TagRow[]
            if (groupTags.length != filteredTags.length) unmatched = true
            return filteredTags
        })


        return {
            header: filtered.map(group => group.map(v => v.name).join('+')).join(', '),
            hints: allTags.map((v) => ['', v.name]),
        }
    }

    action(this: Omnibar, input: string): boolean {
        input = input ?? ''
        const tagGroups = input.split(',').map(v => v.split('+'))
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

        if (value != null) {
            const output: QueryProp = { key: 'tags', input, value: { tags: value } }
            this.queryProps.push(output)
            return true
        } else {
            return this.wiggle()
        }

    }
}


class ArchiveInput implements OmniInput {
    key: [string, string] = ['archived', 'true/false']

    hint(this: Omnibar, input: string): Hint {
        const header = (input == 'true' || input == 'false') ? input : ''
        const hints: [string, string][] = [['', 'true'], ['', 'false']]

        const value: boolean = (header == '') ? null : JSON.parse(header)
        return { header: header, hints: hints }
    }

    action(this: Omnibar, input: string): boolean {
        const value = input == 'true' ? true : input == 'false' ? false : null

        console.log(`INPUT:${input} | VALUE:${value}`)

        if (value != null) {
            const output: QueryProp = { key: 'archived', input, value: { archived: value } }
            this.queryProps.push(output)
            return true
        } else {
            return this.wiggle()
        }

    }
}



class SearchInput implements OmniInput {
    key: [string, string] = ['search', 'search-string']

    hint(this: Omnibar, input: string): Hint {
        return { header: `search: ${input}`, hints: [] }
    }

    action(this: Omnibar, input: string): boolean {
        const val = input == '' ? null : input
        if (val != null) {
            const value = { search: { body: val, header: val } }
            const output: QueryProp = { key: 'search', input, value }
            this.queryProps.push(output)
            return true
        } else {
            return this.wiggle()
        }

    }

}


class DateInput implements OmniInput {

    key: [string, string] = ['created', 'date expression']

    hint(this: Omnibar, input: string): Hint {
        input = input ?? ''

        const examples: [string, string][] = [
            ["shorthand", "1d, 3w, 2m, 4y"],
            ["date", "2011, 2011-12, 2011-12-14"],
            ["start/end", "2011 - 1d"],
            ["date/date", "2015 - 2016"]
        ]

        const split = input.split(' - ')
        const start = split[0]
        const end = split[1]

        const [wordRegex, numRegex] = DATE_REGEX

        const valStart = start.match(wordRegex) || start.match(numRegex)
        const valEnd = (end != null) ? (end.match(wordRegex) || end.match(numRegex)) : true
        if (!(valStart && valEnd)) return {
            header: 'Improper date formatting',
            hints: examples,
        }

        const results = dateParser([start, end])
        const isoStart = DateTime.fromSeconds(results[0])
            .toISO({ suppressMilliseconds: true, suppressSeconds: true, includeOffset: false })
        const isoEnd = DateTime.fromSeconds(results[1])
            .toISO({ suppressMilliseconds: true, suppressSeconds: true, includeOffset: false })

        return { header: `${isoStart} - ${isoEnd}`, hints: examples }
    }

    action(this: Omnibar, input: string): boolean {
        const split = input.split(' - ')
        const start = split[0]
        const end = split[1]

        const [wordRegex, numRegex] = DATE_REGEX

        const valStart = start.match(wordRegex) || start.match(numRegex)
        const valEnd = (end != null) ? (end.match(wordRegex) || end.match(numRegex)) : true
        if (!(valStart && valEnd)) return this.wiggle()


        const results = dateParser([start, end])
        const isoStart = DateTime.fromSeconds(results[0])
            .toISO({ suppressMilliseconds: true, suppressSeconds: true, includeOffset: false })
        const isoEnd = DateTime.fromSeconds(results[1])
            .toISO({ suppressMilliseconds: true, suppressSeconds: true, includeOffset: false })


        const value: Pick<Query, 'created'> = { created: end == null ? [start, null] : [start, end] }
        const output: QueryProp = { key: 'created', input, value }
        this.queryProps.push(output)

        return true
    }

}




class SortingInput implements OmniInput {

    key: [string, string] = ['sort', 'type + depth']


    hint(this: Omnibar, input: string): Hint {
        const header = `sort: by=${this.sort.by}, depth=${this.sort.depth}`
        const hints: [string, string][] = [
            ["by=", "date (default) | cat"],
            ["depth=", "null (default) or number"]
        ]
        return { header: header, hints: hints }
    }

    action(this: Omnibar, input: string): boolean {
        const match = input.match(/^(by=|depth=)(.*)/)

        if (match == null) return this.wiggle()

        if (match[1] == 'by=' && ['date', 'cat'].includes(match[2])) {
            this.sort.by = match[2] as ('date' | 'cat')
            return true
        }

        if (match[1] == 'depth=' && (match[2] == 'null' || parseInt(match[2]) > 0)) {
            this.sort.depth = match[2] == 'null' ? null : parseInt(match[2])
            return true
        }

        return this.wiggle()
    }

}

// other actions: 
// - sessions: list, switch, create, delete
// - rename: tags, categories
// - selection: select-all, deselect-all
// - query: run, clear
class QuickAccessInput implements OmniInput {
    key: [string, string] = ['quick', '[save | load | delete ] ']

    hint(this: Omnibar, input: string): Hint {

        const saved = this.app.session.getLocal<[string, QuickAccessState][]>('quick-access') ?? []
        const hints: [string, string][] = saved.map(([name, state]) => {
            const sort = `${state.sort.by}/${state.sort.depth}`
            const vars = state.queryProps.map(v => v.key).join(' | ')
            return [name, `${sort} | ${vars}`]
        })

        return {
            header: 'quick [save | load | delete] [name]',
            hints: hints
        }
    }

    action(this: Omnibar, input: string): boolean {
        input = input ?? ''
        const split = input.split(' ')
        const loaded = this.app.session.getLocal<[string, QuickAccessState][]>('quick-access') ?? []

        if (split.length != 2 || split[1] == '') return this.wiggle()

        if (split[0] == 'save') {
            if (loaded.map(v => v[0]).includes(split[1])) return this.wiggle()
            loaded.push([split[1], { queryProps: this.queryProps, sort: this.sort }])
            this.app.session.setLocal('quick-access', loaded)
            this.resetInputs()
            return true
        }

        if (split[0] == 'load') {
            if (!loaded.map(v => v[0]).includes(split[1])) return this.wiggle()
            const match = loaded.find(v => v[0] == split[1])!
            this.sort = match[1].sort
            this.queryProps = match[1].queryProps
            this.acceptInputs()
            this.resetInputs()
            this.closeOmnibar()
            return true
        }

        if (split[0] == 'delete') {
            if (!loaded.map(v => v[0]).includes(split[1])) return this.wiggle()
            const ind = loaded.findIndex(v => v[0] == split[1])!
            loaded.splice(ind, 1)
            this.app.session.setLocal('quick-access', loaded)
            // redisplay
            const hints = this.getHints(this.input.value)
            this.displayHints(hints)
            return true
        }

        return this.wiggle()
    }
}

class QueryInput implements OmniInput {
    key: [string, string] = ['query', 'run | clear']

    hint(this: Omnibar, input: string): Hint {
        return {
            header: 'syntax: query <run | clear>',
            hints: []
        }
    }

    action(this: Omnibar, input: string): boolean {
        if (!['run', 'clear'].includes(input)) return this.wiggle()

        if (input == 'run') {
            if (this.queryProps.length == 0) return this.wiggle()
            this.acceptInputs()
            this.saveToHistory()
            this.resetInputs()
            this.closeOmnibar()
            return true
        }

        if (input == 'clear') {
            this.resetInputs()

            return true
        }

        return this.wiggle()
    }

}



class HistoryInput implements OmniInput {
    key: [string, string] = ['hist', '[number]']

    hint(this: Omnibar, input: string): Hint {
        const hints: [string, string][] = this.history.map((v, ind) => {
            const sort = `by=${v.sort.by} depth=${v.sort.depth}`
            const props = v.props.map(v => `${v.key}:${v.input}`).join('|')
            return [`${ind + 1}`, `${sort} ${props}`]
        })
        return {
            header: 'syntax: hist [run | load] [1..9]',
            hints: hints
        }
    }

    action(this: Omnibar, input: string): boolean {
        input = input ?? ''

        const split = input.split(' ')
        if (split.length != 2 || split[1] == '') return this.wiggle()

        const num = parseInt(split[1])
        if (num < 1 || num > 9 || this.history[num - 1] == null) return this.wiggle()


        if (split[0] == 'run') {
            this.queryProps = this.history[num - 1].props
            this.sort = { ...this.history[num - 1].sort }
            this.acceptInputs()
            this.closeOmnibar()
            return true 
        }

        if (split[0] == 'load') {
            this.queryProps = this.history[num - 1].props
            this.sort = { ...this.history[num - 1].sort }
            const hints = this.getHints('')
            this.displayHints(hints)
            return true
        }

        return false

    }
}


export default class Omnibar {

    app: App
    el: HTMLElement
    input: HTMLInputElement
    queryProps: QueryProp[]
    sort: ViewSort
    history: Array<{ props: QueryProp[], sort: ViewSort }> = []
    private defaultSort: ViewSort = { by: 'date', depth: 1 }

    omniInputs: OmniCollection = {
        query: [
            new CatInput(), new TagInput(), new ArchiveInput(), new SearchInput(), new DateInput()
        ],
        commands: [new QuickAccessInput(), new QueryInput(), new HistoryInput()],
        sort: [new SortingInput()]
    }

    constructor(app: App) {
        this.app = app
        this.el = document.querySelector(".omnibar-full")!
        this.input = document.querySelector(".omnibar-input")!
        this.queryProps = []
        this.sort = { ...this.defaultSort }

        this.configureEvents()
        this.configureControlKeys()
        this.configureShortcutKeys()
    }

    private configureEvents() {
        document.addEventListener('click', (event) => {
            if (event.target as HTMLElement == this.el) this.closeOmnibar()
        })
    }

    private configureControlKeys() {
        const context = this
        hotkeys.setScope('main')


        hotkeys('/', { scope: 'main' }, (event, handler) => {
            event.preventDefault()
            this.openOmnibar()
        })

        hotkeys('/', { scope: 'omnibar' }, (event, handler) => {
            event.preventDefault()
            this.closeOmnibar()
            this.input.value = ''
        })

        hotkeys('escape', { scope: 'omnibar' }, (event) => {
            event.preventDefault()
            this.closeOmnibar()
            this.input.value = ''
        })

        hotkeys('tab', { scope: 'omnibar' }, (event) => {
            event.preventDefault()
            console.log('TAB!')
        })


        // accept query subpart OR exec the #command
        hotkeys('enter', { scope: 'omnibar' }, function (event) {
            event.preventDefault()
            const success = context.runActions(context.input.value)
            if (success) context.input.value = ""
        })

        hotkeys.filter = function (event: Event) {
            const tagName = (event.target as HTMLElement).tagName
            if (hotkeys.getScope() == 'omnibar' && event.target == context.input) {
                if (event.type == 'keyup') {
                    // console.log(`${(event as KeyboardEvent).key} @ ${event.type} was pressed!`)
                    const hint = context.getHints(context.input.value)
                    context.displayHints(hint!)
                }
                return true
            }
            if (tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA') return false
            if (hotkeys.getScope() == 'main') return true
            return false
        }
    }


    private configureShortcutKeys() {
        hotkeys('ctrl+enter', { scope: 'omnibar' }, (event) => {
            event.preventDefault()
            const success = this.runActions('#query run')
            if (success) this.input.value = ''
        })

        for (let i = 1; i <= 9; i++) {
            hotkeys(`shift+${i}`, { scope: 'main' }, (event) => {
                this.runActions(`#quick load ${i}`)
            })
        }
    }



    wiggle() {
        this.input.classList.add('wiggle')
        setTimeout(() => this.input.classList.remove('wiggle'), 250)
        return false
    }

    openOmnibar() {
        this.el.style.display = "block"
        hotkeys.setScope('omnibar')
        console.log('Scope set:', hotkeys.getScope())
        this.input.focus()
    }

    closeOmnibar() {
        hotkeys.setScope('main')
        console.log('Scope set:', hotkeys.getScope())
        this.el.style.display = "none"
    }

    acceptInputs() {
        const query = Object.assign({ type: 'full' }, ...this.queryProps.map(v => v.value))
        this.app.session.updateContent(query, this.sort)
    }

    sortUpdated() {
        return this.sort.by != this.defaultSort.by || this.sort.depth != this.defaultSort.depth
    }

    resetInputs() {
        this.queryProps = []
        this.sort = { ...this.defaultSort }
        this.input.value = ''
    }

    saveToHistory() {
        const last = { props: this.queryProps, sort: this.sort }
        this.history = [last].concat(this.history).slice(0, 9)
    }

    displayHints(hint: Hint) {
        const hintSelected: HTMLHeadElement = this.el.querySelector('.hinting-selected')!
        const hintValidated: HTMLUListElement = this.el.querySelector('.hinting-validated')!
        const hintHeader: HTMLHeadElement = this.el.querySelector('.hinting-header')!
        const hintList: HTMLUListElement = this.el.querySelector('.hinting-list')!

        hintSelected.innerHTML = ""
        hintValidated.innerHTML = ""
        hintHeader.innerHTML = ""
        hintList.innerHTML = ""

        const genList = (key: string, input: string) => {
            const li = document.createElement('li')
            li.innerHTML = `<b>${key}</b> ${input}`
            hintValidated.appendChild(li)
        }

        if (this.sortUpdated()) {
            genList('sort:', `by=${this.sort.by} depth=${this.sort.depth}`)
        }

        if (this.queryProps.length > 0) {
            this.queryProps.forEach(({ key, input }) => {
                genList(key, input)
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



    getHints(input: string): Hint {
        const match = input.match(/^(\:|#|@)([^\s]+)? *(.*$)?/)
        if (match == null) return {
            header: 'Input format:', hints: [
                [':', 'build query'],
                ['#', 'exec commands'],
                ['@', 'configure sorting']
            ]
        }

        let prop: 'commands' | 'query' | 'sort'
        switch (match[1]) {
            case ':': prop = 'query'; break
            case '#': prop = 'commands'; break
            case '@': prop = 'sort'; break
        }

        if (match[1] == null || !this.omniInputs[prop!].map(v => v.key[0]).includes(match[2])) {
            return {
                header: prop!,
                hints: this.omniInputs[prop!].map(v => [v.key[0], v.key[1]])
            }
        } else {
            return this.omniInputs[prop!].find(v => v.key[0] == match[2])?.hint.bind(this)(match[3])!
        }

    }

    private runActions(input: string): boolean {
        const match = input.match(/^(\:|#|@)([^\s]+)? *(.*$)?/)
        if (match == null) return this.wiggle()

        let prop: 'commands' | 'query' | 'sort'
        switch (match[1]) {
            case ':': prop = 'query'; break
            case '#': prop = 'commands'; break
            case '@': prop = 'sort'; break
        }

        console.log(`RUN ACTIONS match2:${match[2]}`)
        if (match[2] == null || !this.omniInputs[prop!].map(v => v.key[0]).includes(match[2]))
            return this.wiggle()

        const success = this.omniInputs[prop!].find(v => v.key[0] == match[2])?.action.bind(this)(match[3])!
        return success != null ? success : false
    }
}


