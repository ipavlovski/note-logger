import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

var options: MarkdownIt.Options = {
    html: false,
    breaks: false,
    typographer: false,
    langPrefix: 'language-',
    linkify: true,
    highlight: function (str, lang) {
        // console.log("HIGHLIGHTING!")
        // return hljs.highlight(str, { language: lang }).value
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(str, { language: lang }).value
        } else {
            return str
        }
    }
}

const md = new MarkdownIt(options)
export default md


