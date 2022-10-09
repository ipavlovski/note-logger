import { showNotification } from '@mantine/notifications'
import Editor from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import { ClipboardEvent, useRef } from 'react'
import { Observable, timer } from 'rxjs'
import { debounce } from 'rxjs/operators'

import type { LeafWithImages } from 'backend/routes/leaf'
import { nodeApi } from 'frontend/api'
import { stopLeafEditing } from 'frontend/slices'
import { useAppDispatch } from 'frontend/store'
import { getClipboardImage } from 'frontend/util'

const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`

interface MonacoProps {
  leaf: LeafWithImages
  markdown: string
}
export default function Monaco({ leaf, markdown }: MonacoProps) {
  const dispatch = useAppDispatch()
  const editorRef = useRef<null | editor.IStandaloneCodeEditor>(null)
  const [updateContents] = nodeApi.useUpdateLeafContentsMutation()
  const [uploadGallery] = nodeApi.useUploadGalleryMutation()

  const handleMonacoPaste = async (e: ClipboardEvent<HTMLInputElement>) => {
    try {
      const formData = await getClipboardImage('inline')
      const { path } = await uploadGallery({ leafId: leaf.id, formData: formData }).unwrap()
      path && editorRef.current!.trigger('keyboard', 'type', { text: `![](${SERVER_URL}/${path})` })

      e.stopPropagation()
      e.preventDefault()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      if (msg != 'Missing clipboard handler')
        showNotification({ title: 'ctrl+v', message: msg, color: 'red', autoClose: 1600 })
    }
  }

  // this function has to be  here
  function handleEditorChange(value: string | undefined, event: editor.IModelContentChangedEvent) {}

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: any) {
    // here is the editor instance, you can store it in `useRef` for further usage
    editorRef.current = editor
    // @ts-ignore
    editor.getDomNode()!.addEventListener('paste', handleMonacoPaste)

    new Observable(observer => {
      editor.getModel()!.onDidChangeContent(event => {
        observer.next(event)
      })
    })
      .pipe(debounce(() => timer(300)))
      .subscribe(() => {
        const content = editor.getValue()
        if (content) updateContents({ content: content, leafId: leaf.id })
      })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM, () => {
      console.log('ctrl+m')
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyM, () => {
      console.log('ctrl+shift+m')
    })

    editor.addCommand(monaco.KeyCode.Escape, () => {
      console.log('escape')

      const content = editor.getValue()
      if (content) updateContents({ content: content, leafId: leaf.id })

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
