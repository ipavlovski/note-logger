import { NodeWithProps } from 'common/types'
import { Context } from 'frontend/App'
import { ClipboardEvent, useContext, useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import ReactMarkdown from 'react-markdown'
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'

import { Observable, timer } from 'rxjs'
import { debounce } from 'rxjs/operators'

function Leaf(props: any) {
  // const initmd = props.node.content
  const [markdown, setMarkdown] = useState(props.leaf.content)
  const editorRef = useRef<null | editor.IStandaloneCodeEditor>(null)

  const [imgURL, setImgURL] = useState('https://picsum.photos/420/320')

  const handleClipboardEvent = (e: ClipboardEvent<HTMLInputElement>) => {
    // @ts-ignore
    const descriptor: PermissionDescriptor = { name: 'clipboard-read' }

    navigator.permissions.query(descriptor).then(result => {
      // If permission to read the clipboard is granted or if the user will
      // be prompted to allow it, we proceed.

      if (result.state == 'granted' || result.state == 'prompt') {
        navigator.clipboard.read().then(data => {
          for (let i = 0; i < data.length; i++) {
            if (!data[i].types.includes('image/png')) {
              console.log('Clipboard contains non-image data. Unable to access it.')
            } else {
              data[i].getType('image/png').then(blob => {
                const url = URL.createObjectURL(blob)
                console.log('url:', url)
                setImgURL(url)
              })
            }
          }
        })
      }
    })
  }

  const handleMonacoPaste = async (e: ClipboardEvent<HTMLInputElement>) => {
    // @ts-ignore
    const descriptor: PermissionDescriptor = { name: 'clipboard-read' }
    const result = await navigator.permissions.query(descriptor)

    if (result.state == 'granted' || result.state == 'prompt') {
      const allData = await navigator.clipboard.read()
      const data = allData[0]

      if (data.types.includes('image/png')) {
        const blob = await data.getType('image/png')
        const url = URL.createObjectURL(blob)
        console.log('url:', url)
        setImgURL(url)

        e.stopPropagation()
        e.preventDefault()
      }
    }
  }

  async function updateNodeContent(leafId: number, content: string) {
    const url = `https://localhost:3002/leaf/${leafId}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    console.log(`Update status: ${res.status}`)
  }

  function handleEditorChange(value: string | undefined, event: editor.IModelContentChangedEvent) {
    // this has to be here
    // the value is a change
  }

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: any) {
    // here is the editor instance
    // you can store it in `useRef` for further usage
    editorRef.current = editor
    // @ts-ignore
    editor.getDomNode()!.addEventListener('paste', handleMonacoPaste)

    const obs = new Observable(observer => {
      editor.getModel()!.onDidChangeContent(event => {
        observer.next(event)
      })
    })
    obs.pipe(debounce(() => timer(300))).subscribe(() => {
      const value = editor.getValue()
      console.log('changing some stuff')
      if (value) {
        setMarkdown(value)
        updateNodeContent(props.leaf.id, value)
      }
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM, () => {
      console.log('ctrl+m')
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyM, () => {
      console.log('ctrl+shift+m')
    })

    editor.addCommand(monaco.KeyCode.Escape, () => {
      console.log('escape')

      setEditing(false)
    })
  }

  const [isEditing, setEditing] = useState(false)

  return (
    <div onDoubleClick={() => setEditing(true)}>
      <p>{props.leaf.createdAt}</p>
      {isEditing ? (
        <Editor
          height="30vh"
          defaultLanguage="markdown"
          defaultValue={markdown}
          theme="vs-dark"
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{ quickSuggestions: false, minimap: { enabled: false }, fontSize: 16 }}
        />
      ) : (
        <ReactMarkdown
          children={markdown}
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <SyntaxHighlighter
                  children={String(children).replace(/\n$/, '')}
                  // @ts-ignore
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                />
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            },
          }}
        />
      )}
    </div>
  )
}

// AT THE END OF MONACO - example of clipboard-catching div
// <div>
// {/* enctype="image/png" */}
// <input type="text" onPasteCapture={handleClipboardEvent} />
// </div>
// <img src={imgURL} />

function NodeView() {
  const { state, dispatch } = useContext<Context>(Context)

  const [node, setNode] = useState<NodeWithProps>()

  const fetchNode = async (nodeId: number) => {
    const url = `https://localhost:3002/node/${nodeId}`
    return await fetch(url).then(v => v.json())
  }

  useEffect(() => {
    fetchNode(state.activeNodeId).then(v => setNode(v))
  }, [state.activeNodeId])

  const createNewEditor = async () => {
    console.log('create new editor!')

    // create a new node
    const nodeId = node!.id
    const url = `https://localhost:3002/node/${nodeId}/leaf`
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    })
    console.log(`Update status: ${res.status}`)

    // re-fetch
    fetchNode(state.activeNodeId).then(v => setNode(v))
  }

  return (
    <>
      <div style={{ gridArea: 'preview' }}>
        <h1>{node?.title}</h1>
      </div>
      <div style={{ gridArea: 'leafs' }}>
        {node?.leafs.map(leaf => {
          return (
            <div key={leaf.id}>
              <hr></hr>
              <Leaf leaf={leaf} />
            </div>
          )
        })}
        <hr onClick={createNewEditor} style={{ padding: '2px', margin: '1rem' }}></hr>
      </div>
    </>
  )
}

export default NodeView
