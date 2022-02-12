import { CatRow, Item, TagRow } from 'common/types'
import App from 'frontend/app'
import { debounce, fromEvent, timer } from 'rxjs'

type PartialItem = Partial<Omit<Item, 'id' | 'body' | 'archived'>>

export default class Metabar {
    el: HTMLInputElement
    app: App
    private showingError = false

    constructor(app: App) {
        this.app = app
        this.el = document.querySelector("input.meta-input")!

        fromEvent(this.el, 'keyup').pipe(
            debounce(() => timer(150))
        ).subscribe(() => {
            const result = this.parse(this.el.value, false)
            this.updateBoxColor(result)
        })

        // NOTE: ADD A 'suppressor' if error is showing...
        this.el.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                const result = this.parse(this.el.value, true)
            }
        })
    }

    updateBoxColor(result: null | PartialItem) {
        let color: string
        result == null ? color = '#970000' : color = '#185300'
        //  || result?.header == null || result?.created == null
        if (this.el.value == '') {
            color = '#414141'
        }
        this.el.style.borderColor = color
    }


    flashError(error: string) {
        if (this.showingError == true) return
        const currValue = this.el.value
        this.showingError = true
        this.el.setAttribute('readonly', 'readonly')
        this.el.value = error
        setTimeout(() => {
            this.el.removeAttribute('readonly')
            this.el.value = currValue
            this.showingError = false
        }, 1400)
    }


    // var input = "D:now H:'this is a header' C:a>b>c>d>e>f T:tag1,tag2:tag5,tag3"
    parse(input: string, showError: boolean): null | PartialItem {
        var trimmed = input.split(/(\b\w:)/g).filter(v => v != '').map(v => v.trim())
        const output: PartialItem = {}

        if (trimmed.length < 2) {
            if (showError) this.flashError('Cant identify more then 2 elements in the string')
            return null
        }

        for (let ind = 0; ind < trimmed.length - 1; ind++) {
            // skip odd numbers -> only work in pairs
            if (ind % 2 != 0) continue

            // get the value pairs
            const key = trimmed[ind]
            const val = trimmed[ind + 1]

            try {
                switch (key) {
                    case 'H:': output.header = this.parseHeader(val); break
                    case 'D:': output.created = this.parseCreated(val); break
                    case 'U:': output.updated = this.parseUpdated(val); break
                    case 'C:': output.category = this.parseCats(val); break
                    case 'T:': output.tags = this.parseTags(val); break
                    default:
                        const msg = `'${key}' is not a valid key. Must be one of H:/D:/U:/C:/T:`
                        if (showError) this.flashError(msg)
                        return null
                }
            } catch (err) {
                const message = (err as Error).message
                if (showError) this.flashError(message)
                return null
            }
        }
        return output
    }


    parseHeader(str: string): string {
        if (!str.match('^\'') || !str.match('\'$'))
            throw new Error("The header field needs to be surrounded by single quotes.")

        if (str == '')
            throw new Error("The header field cannot be empty.")

        return str.slice(1, -1)
    }

    parseCreated(val: string): Date {
        // check that the date 
        // keywords: now
        return new Date()
    }

    parseUpdated(val: string): Date {
        // check that the updated is AFTER created
        // keywords: now, null
        return new Date()

    }

    parseCats(val: string): CatRow[] {
        var catNames = val.split('>')
        const cats = this.app.session.meta.catTree.walk(catNames)
        if (catNames.length != cats.length)
            throw new Error(`Cat '${catNames[cats.length - 1]}' doesn't exist`)

        return cats
    }

    parseTags(val: string): TagRow[] {
        var tagNames = val.split(',')
        const tags: TagRow[] = []
        for (const tagName of tagNames) {
            const match = this.app.session.meta.tags.find(tag => tag.name == tagName)
            if (match == null && /!$/.test(tagName)) {
                tags.push({ id: null, name: tagName })
            } else if (match == null && ! /!$/.test(tagName)) {
                throw new Error(`Tag '${tagName}' doesn't exist`)
            } else {
                tags.push(match!)
            }
        }

        return tags

    }


}







