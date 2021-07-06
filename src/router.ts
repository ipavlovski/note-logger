import express from "express"
import MarkdownIt from 'markdown-it'
import fs from 'fs/promises'
import sh from 'shelljs'
import hljs from 'highlight.js'

const router = express.Router()

// list all files in the dir
function getMarkdownFiles(dirs: string, regex: RegExp): string[] {
    return sh.ls(dirs).filter(v => regex.test(v.toString()))
}

const files = getMarkdownFiles('~/.notes/**/*.md', /hardware.*code/)
console.log("NUMBER OF FILES: %s", files.length)

var options = {
    highlight: function (str: string, lang: string, attrs: string) {
        if (lang && hljs.getLanguage(lang)) {
            try { 
                return hljs.highlight(lang, str).value 
            } catch (error) { 
                console.error(error) 
            }
        }

        return ''
    }
}
var md = MarkdownIt(options)





router.get('/', async (req, res) => {
    console.log("RENDERING:")
    res.render('index', { title: 'EXPRESS TEST' });
})

router.get('/parse/:id', async (req, res) => {
    const id = parseInt(req.params.id)
    const file = await fs.readFile(files[id]).then(buffer => buffer.toString())
    const html = md.render(file)
    res.json(html)
})


export { router }