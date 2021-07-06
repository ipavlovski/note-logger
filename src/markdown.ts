import sh from 'shelljs'
import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'

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
var md = MarkdownIt(options).enable('image')

export { files, md }