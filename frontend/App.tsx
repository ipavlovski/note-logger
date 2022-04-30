import React, { ClipboardEvent, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import './index.css'
import Monaco, { editor } from 'monaco-editor'

import ReactMarkdown from 'react-markdown'
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, darcula } from 'react-syntax-highlighter/dist/esm/styles/prism'

import remarkGfm from 'remark-gfm'

const initmd = `
Here is some JavaScript code:

~~~js
console.log('It works!')
~~~

## hellow world 2
A paragraph with *emphasis* and **strong importance**.

> A block quote with ~strikethrough~ and a URL: https://reactjs.org.

* Lists
* [ ] todo
* [x] done

A table:

| a | b |
| - | - |
|data|df sf|
`

function CustomButton() {
  const [msg, setButtonText] = useState('test...')

  const fetchData = () => {
    const text = fetch('https://homelab:3002/select')
      .then(v => v.text())
      .then(t => {
        console.log('fetched text is: ', t)
        setButtonText(t)
      })
  }

  return (
    <>
      <button onClick={fetchData}>{msg}</button>
    </>
  )
}

function App() {
  const [markdown, setMarkdown] = useState(initmd)
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

  function handleEditorChange(value: string | undefined, event: editor.IModelContentChangedEvent) {
    if (value) setMarkdown(value)
  }

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: any) {
    // here is the editor instance
    // you can store it in `useRef` for further usage
    editorRef.current = editor
    // @ts-ignore
    editor.getDomNode()!.addEventListener('paste', handleMonacoPaste)
  }

  return (
    <div>
      <CustomButton />
      <Editor
        height="30vh"
        defaultLanguage="markdown"
        defaultValue={initmd}
        theme="vs-dark"
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
      />

      <ReactMarkdown
        children={markdown}
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                children={String(children).replace(/\n$/, '')}
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
      <div>
        {/* enctype="image/png" */}
        <input type="text" onPasteCapture={handleClipboardEvent} />
      </div>
      <img src={imgURL} />
    </div>
  )
}

export default App
