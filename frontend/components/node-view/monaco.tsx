import Editor from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import { ClipboardEvent, useRef } from 'react'
import { Observable, timer } from 'rxjs'
import { debounce } from 'rxjs/operators'
import client from 'frontend/client'
import { useAppDispatch } from 'frontend/store'
import { stopLeafEditing } from 'components/node-view/node-view-slice'

import type { LeafWithImages } from 'backend/routes/leaf'
import { nodeApi } from 'frontend/api'

const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`

// setEditing: (value: React.SetStateAction<boolean>) => void

async function uploadLeafImage(leafId: number, content: Blob, type: 'inline' | 'gallery') {
  const formData = new FormData()
  formData.append('image', content, type)

  const { path } = await client.upload(`/leaf/${leafId}/upload`, formData)
  return path
}

interface MonacoProps {
  leaf: LeafWithImages
  markdown: string
}
export default function Monaco({ leaf, markdown }: MonacoProps) {
  const dispatch = useAppDispatch()
  const editorRef = useRef<null | editor.IStandaloneCodeEditor>(null)
  const [updateContents] = nodeApi.useUpdateLeafContentsMutation()

  const handleMonacoPaste = async (e: ClipboardEvent<HTMLInputElement>) => {
    // @ts-ignore
    const descriptor: PermissionDescriptor = { name: 'clipboard-read' }
    const result = await navigator.permissions.query(descriptor)

    if (result.state == 'granted' || result.state == 'prompt') {
      const allData = await navigator.clipboard.read()
      const data = allData[0]

      if (data.types.includes('image/png')) {
        const blob = await data.getType('image/png')
        const path = await uploadLeafImage(leaf.id, blob, 'inline')

        if (path) {
          // const { lineNumber, column } = editorRef.current?.getPosition()!
          editorRef.current!.trigger('keyboard', 'type', {
            text: `![](${SERVER_URL}/${path})`,
          })
        }

        e.stopPropagation()
        e.preventDefault()
      }
    }
  }

  // this function has to be  here
  function handleEditorChange(value: string | undefined, event: editor.IModelContentChangedEvent) {}

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
      const content = editor.getValue()
      if (content) {
        // dispatch(setLeafContent({ leafId: leaf.id, content: content }))
        // setMarkdown(content)
        // client.post<{ content: string }, string>(`/leaf/${leaf.id}/update`, { content })
        updateContents({ content: content, leafId: leaf.id})
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

      dispatch(stopLeafEditing(leaf.id))
    })
  }

  return (
    <Editor
      height="30vh"
      defaultLanguage="markdown"
      defaultValue={markdown}
      theme="vs-dark"
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
      options={{ quickSuggestions: false, minimap: { enabled: false }, fontSize: 16 }}
    />
  )
}
