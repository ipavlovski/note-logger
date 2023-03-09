import { Anchor, Blockquote, Modal, Table, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import CustomCodeComponent from 'components/remark/code'
import { DirectivesComponent, directivesHandler } from 'components/remark/directives'
import { useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { HeadingProps } from 'react-markdown/lib/ast-to-react'
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'

SyntaxHighlighter.registerLanguage('typescript', typescript)

function Header1Component({ node,children, className }: HeadingProps) {

  return (
    <div style={{ position: 'relative' }}>
      <Title order={1} transform='capitalize' size={28} mt={30} mb={4} >{children}</Title>
    </div>
  )

}

function Header2Component({ node,children, className }: HeadingProps) {

  return (
    <div style={{ position: 'relative' }}>
      <Title underline order={2} transform='capitalize' size={24} mt={22} mb={4}>{children}</Title>
    </div>
  )

}

function Header3Component({ node, children, className }: HeadingProps) {
  return (
    <Title order={3} transform='uppercase' size={18} mt={20} mb={4}
      style={{ fontFamily: 'Inter' }} weight={800}>{children}
    </Title>
  )


}

function GenericHeaderComponent({ node,children, className }: HeadingProps) {
  return <Title order={4} size={18} weight={600} style={{ fontFamily: 'Inter' }}>{children}</Title>
}

function ImageComponent(props: JSX.IntrinsicElements['img']) {
  const ref = useRef<HTMLImageElement>(null)
  const [opened, { close, open }] = useDisclosure(false)


  // const isMinimized = ref.current && (ref.current?.naturalWidth > ref.current?.width ||
  //   ref.current?.naturalHeight > ref.current?.height)
  const handler = () => {
    open()
  }
  return (
    <>
      <img ref={ref} src={props.src} alt={props.alt} onClick={handler}
        style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto',
          cursor: 'pointer' }} />

      {
        <Modal opened={opened} onClose={close} size="auto" centered title={props.alt}
          withCloseButton={false}>
          <img ref={ref} src={props.src} alt={props.alt} onClick={handler}
            style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto' }} />
        </Modal>
      }
    </>
  )
}

function BlockquoteComponent(props: JSX.IntrinsicElements['blockquote']) {

  const anchor = <Anchor href="https://mantine.dev/" target="_blank"> - Mantine docs </Anchor>
  return (
    <Blockquote color='cactus.0' cite={anchor}>{props.children}</Blockquote>
  )
}

function TableComponent(props: JSX.IntrinsicElements['table']) {
  return (
    <Table highlightOnHover>{props.children}</Table>
  )
}

export default function Remark({ markdown }: { markdown: string }) {

  const md = markdown == '' ? 'Empty element' : markdown
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkDirective, directivesHandler]}
      components={{
        code: CustomCodeComponent,
        h1: Header1Component,
        h2: Header2Component,
        h3: Header3Component,
        h4: GenericHeaderComponent,
        h5: GenericHeaderComponent,
        h6: GenericHeaderComponent,
        img: ImageComponent,
        blockquote: BlockquoteComponent,
        table: TableComponent,
        section: DirectivesComponent
      }}>
      {md}
    </ReactMarkdown>
  )
}