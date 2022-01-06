import hotkeys from 'hotkeys-js'
import App from 'frontend/code/app'

export default class Omnibar {
    el: HTMLElement
    input: HTMLElement
    app: App
    hinting: boolean

    constructor(app: App) {
        this.app = app
        this.el = document.querySelector(".omnibar-full")
        this.input = document.querySelector(".omnibar-input")

        document.addEventListener('click', (event) => {
            if (event.target as HTMLElement == this.el) this.closeOmnibar()
        })

        this.configureShortcuts()

    }

    configureShortcuts() {
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
            console.log('pressed enter')
        })

        hotkeys('escape', { scope: 'omnibar' }, (event) => {
            event.preventDefault()
            this.closeOmnibar()
        })

        hotkeys('tab', { scope: 'omnibar' }, (event) => {
            event.preventDefault()
            this.toggleHint()

            const hint = this.el.querySelector('.omnibar-input')
            hint.classList.add('wiggle')
            setTimeout(() => hint.classList.remove('wiggle'), 200)

        })

        hotkeys.filter = (event: Event) => {
            const tagName = (event.target as HTMLElement).tagName
            if (hotkeys.getScope() == 'omnibar' && event.target == this.input) {
                console.log(`${(event as KeyboardEvent).key} @ ${event.type} was pressed!`)


                // TODO: check if the letter fits, if it does='paste' corresponding expansion
                // incremenet inner-variable (keySet)
                // next -> put in the value
                // can use arrows to 





                return true
            }
            if (tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA') return false
            if (hotkeys.getScope() == 'main') return true
            return false
        }
    }


    toggleHint() {
        const hintArray = [
            'S sortby: category vs. date*',
            'O orderItems: name vs. date*',
            'M maxlevel: number (0, 1*, 2, 3, ...)',
            'A archivedINcluded: true/false*',
            'D date: >/=/< 2021-01-21 (*last month)',
            'C category: cat1>subcat>subcat (null*)',
            'T tags: tag1,tag2,tag3 (null*)',
            'H header: text (null*)',
            'B body: text (null*)',
            'L last: last query (-n 5)',
            'Q querySaved: list saved queries',
            '# customCommand: set-default, save, delete'
        ]



        if (this.hinting) {
            this.hinting = false
            this.el.querySelector('.hinting').remove()
        } else {
            this.hinting = true
            const content = this.el.querySelector('.omnibar-content')
            const hint = document.createElement('ul')
            hintArray.forEach(v => {
                const li = document.createElement('li')
                li.innerHTML = v
                hint.appendChild(li)
            })

            hint.classList.add('hinting')
            content.appendChild(hint)
        }
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
}


