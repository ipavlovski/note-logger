import { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { ReactMarkdownProps } from 'react-markdown/lib/ast-to-react'
import { z } from 'zod'
import { PropsWithChildren } from 'react'

import GalleryDirective from 'components/remark/gallery'
import { SERVER_URL } from 'frontend/apis/utils'

/**
 * ```
 * :::callout{color="success"}
 * Great success!
 * :::
 * ```
 */
function CalloutDirective({ color, children }:
PropsWithChildren<{ color: 'notice' | 'success' | 'warning' | 'error' }>) {

  let backgroundColor = '#40639a7c'
  switch (color) {
    case 'notice':
      backgroundColor = '#2a57a07c'
      break
    case 'success':
      backgroundColor = '#50b8187c'
      break
    case 'warning':
      backgroundColor = '#a0902a7c'
      break
    case 'error':
      backgroundColor = '#a0382a7c'
      break
    default:
      color satisfies never
      break
  }

  return (
    <div style={{ backgroundColor }}>
      {children}
    </div>
  )
}


function VideoDirective({ filename }: {filename: string}) {

  return (
    <video width="500" height="auto" autoPlay loop controls>
      <source src={`${SERVER_URL}/${filename}`} type="video/mp4" />
    </video>
  )
}


const directiveParser = z.discriminatedUnion('name', [

  z.object({ name: z.literal('youtube'), type: z.string() }),

  z.object({ name: z.literal('pdf'), type: z.string() }),

  z.object({ name: z.literal('video'), filename: z.string() }),

  z.object({ name: z.literal('gallery') }),

  z.object({
    name: z.literal('callout'),
    color: z.enum(['notice', 'success', 'warning', 'error'])
  }),

  z.object({ name: z.literal('error'), type: z.string() }),

]).catch((ctx) => {
  console.log(ctx.error)
  return ({ name: 'error', type: 'lol' })
})


/**
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
      return <CalloutDirective color={props.color}>{children}</CalloutDirective>

    case 'youtube':
      return <h3>directives youtube</h3>

    case 'gallery':
      return <GalleryDirective nodes={node.children}/>

    case 'pdf':
      return <h3>directives pdf</h3>

    case 'video':
      return <VideoDirective filename={props.filename}/>

    case 'error':
      return <h3>Error parsing directive.</h3>

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