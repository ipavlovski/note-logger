import { CatRow, Item, MetabarProps, TagRow } from 'common/types'
import App from 'frontend/app'
import { DateTime } from 'luxon'
import { debounce, fromEvent, timer } from 'rxjs'

export default class Metabar {
    el: HTMLInputElement
    app: App
    private showingError = false

    constructor(app: App) {
        this.app = app
        this.el = document.querySelector("input.meta-input")!

        fromEvent(this.el, 'keyup').pipe(
            debounce(() => timer(250))
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

    private updateBoxColor(result: null | MetabarProps) {
        let color: string
        result == null ? color = '#970000' : color = '#185300'
        //  || result?.header == null || result?.created == null
        if (this.el.value == '') {
            color = '#414141'
        }
        this.el.style.borderColor = color
    }


    flashError(msg: string) {
        if (this.showingError == true) return
        const currValue = this.el.value
        this.showingError = true
        this.el.setAttribute('readonly', 'readonly')
        this.el.value = msg

        this.el.classList.add('wiggle')
        setTimeout(() => this.el.classList.remove('wiggle'), 100)

        setTimeout(() => {
            this.el.removeAttribute('readonly')
            this.el.value = currValue
            this.showingError = false
        }, 1500)
    }

    clear() {
        this.el.value = ""
        this.updateBoxColor(null)
    }

    getValues(): MetabarProps | null {
        return this.parse(this.el.value, true)
    }


    // var input = "D:now H:'this is a header' C:a>b>c>d>e>f T:tag1,tag2:tag5,tag3"
    private parse(input: string, showError: boolean): null | MetabarProps {
        var trimmed = input.split(/(\b\w:)/g).filter(v => v != '').map(v => v.trim())
        const output: MetabarProps = {}

        // if (trimmed.length < 2) {
        //     if (showError) this.flashError('Cant identify more then 2 elements in the string')
        //     return null
        // }

        if (trimmed.length % 2 != 0) {
            if (showError) this.flashError('Must provide a value for each identifier')
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
                    case 'D:': output.created = this.parseDate(val, 'created'); break
                    case 'U:': output.updated = this.parseDate(val, 'updated'); break
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

        // if (output.header == null) throw new Error("Header field (H:) is required")
        // if (output.created == null) throw new Error("Created field (D:) is required")

        return output
    }


    private parseHeader(str: string): string {
        if (!str.match('^\'') || !str.match('\'$'))
            throw new Error("The header field needs to be surrounded by single quotes.")

        if (str == '')
            throw new Error("The header field cannot be empty.")

        return str.slice(1, -1)
    }

    private parseDate(str: string, type: 'created' | 'updated'): Date {
        if (str == 'now') return new Date()
        const dt = DateTime.fromISO(str)
        if (!dt.isValid) throw new Error(`The '${type}' field couldn't be parsed.`)
        return dt.toJSDate()
    }

    private parseCats(str: string): CatRow[] {
        var catNames = str.split('>')
        const cats = this.app.session.meta.catTree.walk(catNames)
        if (catNames.length != cats.length) {
            throw new Error(`Cat '${catNames[cats.length]}' doesn't exist`)
        }

        return cats
    }

    private parseTags(str: string): TagRow[] {
        var tagNames = str.split(',')
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







