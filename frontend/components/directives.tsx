// import type { Root } from 'remark-gfm'
import { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { ReactMarkdownProps } from 'react-markdown/lib/ast-to-react'
import { z } from 'zod'
import { SERVER_URL } from 'components/app'


function VideoDirective({ filename }: {filename: string}) {

  return (
    <video width="500" height="auto" autoPlay loop controls>
      {/* <source src="https://localhost:3010/1678311631737.mp4" type="video/mp4" /> */}
      <source src={`${SERVER_URL}/${filename}`} type="video/mp4" />
    </video>
  )
}


const directiveParser = z.discriminatedUnion('name', [

  z.object({ name: z.literal('youtube'), type: z.string() }),

  z.object({ name: z.literal('pdf'), type: z.string() }),

  z.object({ name: z.literal('video'), filename: z.string() }),

  z.object({ name: z.literal('gallery'), type: z.string() }),

  z.object({ name: z.literal('callout'), type: z.string() }),

  z.object({ name: z.literal('error'), type: z.string() }),

]).catch((ctx) => {
  console.log(ctx.error)
  return ({ name: 'error', type: 'lol' })
})


/**
 * #### USAGE:
 * ```
 * :::note{title="Welcome" tmp2="asdf" #adsf .loool.asdf}
 * - item1
 * - item2
 * - item3
 * :::
 * ```
 */
export function DirectivesComponent({ children, node }: ReactMarkdownProps) {
  const props = directiveParser.parse(node.properties)
  const { name } = props

  switch(name) {
    case 'callout':
      return <h3>directives callout</h3>

    case 'youtube':
      return <h3>directives youtube</h3>

    case 'gallery':
      return <h3>directives gallery</h3>

    case 'pdf':
      return <h3>directives pdf</h3>

    case 'video':
      return <VideoDirective filename={props.filename}/>

    case 'error':
      return <h3>directives error</h3>

    default:
      name satisfies never
      return null

  }


}

export function directivesHandler(): Plugin<any[], any> {
  return (tree) => {
    visit(tree, (node) => {
      if (['textDirective', 'leafDirective', 'containerDirective'].includes(node.type)) {
        const data = node.data || (node.data = {})
        data.hName = 'section'
        data.hProperties = { ...node.attributes, name: node.name, type: node.type }
      }
    })
  }
}