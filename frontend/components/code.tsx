import { HTMLProps } from 'react'
import { CodeProps } from 'react-markdown/lib/ast-to-react'
import { Node } from 'react-markdown/lib/rehype-filter'
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { z } from 'zod'


function VanillaCode({ className, children }: Pick<CodeProps, 'className' | 'children'>) {
  return (
    <code className={className}>
      {children}
    </code>
  )
}

function BasicCode({ children, lang }: Pick<CodeProps, 'children'> & { lang: string }) {
  return (
    <>
      <SyntaxHighlighter
        language={lang}
        style={okaidia}
        showLineNumbers={true}
        PreTag="div"
        children={String(children).replace(/\n$/, '')}
      />
    </>
  )
}

interface HtmlDataProps<T> extends HTMLProps<T> {
  'data-side-content'?: string
}


const cliHighlighter = (children: CodeProps['children'],
  { prompt, regex }: Extract<CodeDirective, CliDirective>) => {

  const lines = children.toString().trim().split('\n')

  const output: { data: 'cli-prompt' | 'cli-output', 'data-side-content'?: string}[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith(regex)) {
      output.push({ data: 'cli-prompt', 'data-side-content': prompt })
      continue
    }
    if (i-1 >= 0 && output[i-1].data == 'cli-prompt' && lines[i].trim() != '') {
      output.push({ data: 'cli-prompt', 'data-side-content': '>' })
      continue
    }
    output.push({ data: 'cli-output' })
  }

  console.log(output)

  return (lineNum: number): HtmlDataProps<HTMLElement> => {
    return output[lineNum-1]
  }
}

const colorHighlighter = ({ green, red }: Extract<CodeDirective, HlDirective>) => {
  return (lineNum: number): HtmlDataProps<HTMLElement> => {

    return green.includes(lineNum) ? { data: 'hl-green' } :
      red.includes(lineNum) ? { data: 'hl-red' } :
        {}
  }
}


function AdvancedCode({ children, lang, directives }:
Pick<CodeProps, 'children'> & { lang: string, directives: CodeDirective}) {

  const lineHighligter = directives.type == 'cli' ?
    cliHighlighter(children, directives) : colorHighlighter(directives)
  console.log('advanced', directives)

  // note: add extra space to the regex
  const input = directives.type == 'cli' ?
    String(children).replace(/\n$/, '').replaceAll(`${directives.regex} `, '') :
    String(children).replace(/\n$/, '')

  return (
    <SyntaxHighlighter
      language={lang}
      style={okaidia}
      showLineNumbers={true}
      PreTag="div"
      wrapLines={true}
      useInlineStyles={true}
      lineProps={lineHighligter}
      children={input}
    />
  )
}

type CliDirective = { type: 'cli'; prompt: string; regex: string }
type HlDirective = { type: 'highlight', green: number[], red: number[] }
type CodeDirective = CliDirective | HlDirective

const rangeSplit = (str: string) => {
  const nums = str.split(',').map((v) => v.split('-')).map((v) => {
    if (v.length == 1) return parseInt(v[0])
    if (v.length == 2) {
      const v1 = parseInt(v[0])
      const v2 = parseInt(v[1])
      return Array.from({ length: v2-v1+1 }, (_, i) => v1 + i)
    }
    return []
  }).flat()

  return [...new Set(nums)]
}

const DirectivesSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('cli'),
    prompt: z.string(),
    regex: z.string().default('$')
  }),
  z.object({
    type: z.literal('highlight'),
    green: z.string().transform(rangeSplit).pipe(z.number().array()).catch([]).default([]),
    red: z.string().transform(rangeSplit).pipe(z.number().array()).catch([]).default([])
  }),
])

const parseDirectives = (data: Node['data'] | undefined): CodeDirective | null => {
  if (! data?.meta || typeof data.meta != 'string') return null

  // https://stackoverflow.com/questions/366202/regex-for-splitting-a-string
  // ;'prompt="1, 3, 5..7" regex="ip@asdf $"'.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g)
  const props = data.meta.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g)
  if (! props || props.length == 0 || props.length % 2 != 0) return null

  const firstDirective = props[0].replace(/=/g, '')
  const entries: string[][] = firstDirective == 'prompt' || firstDirective == 'regex' ?
    [['type', 'cli']] : [['type', 'highlight']]
  for (let i = 0; i < props.length -1; i++)
    entries.push([props[i].replace(/=/g, ''), props[i+1].replace(/'|"/g, '')])

  const uncheckedDirective = Object.fromEntries(entries)

  try {
    return DirectivesSchema.parse(uncheckedDirective)
  } catch (err) {
    console.log('failed with error: ', err)
    return null
  }
}

export default function CustomCodeComponent({ node, inline, children, className }: CodeProps) {

  const dirs = parseDirectives(node?.data)
  const lang = /language-(\w+)/.exec(className || '')?.[1]

  return (
    !inline && lang && dirs ? <AdvancedCode children={children} lang={lang} directives={dirs} /> :
      !inline && lang ? <BasicCode children={children} lang={lang}/> :
        <VanillaCode className={className} children={children} />
  )
}
