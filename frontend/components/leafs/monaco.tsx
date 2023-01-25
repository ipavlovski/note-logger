import { showNotification } from '@mantine/notifications'
import Editor from '@monaco-editor/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { editor } from 'monaco-editor'
import { ClipboardEvent, useRef } from 'react'
import { Observable, timer } from 'rxjs'
import { debounce } from 'rxjs/operators'

import type { LeafWithImages } from 'backend/routes'
import { SERVER_URL } from 'components/app'
import { useLeafStore } from './leafs'
import { fetchPostUploadGallery, fetchPutUpdateLeafContents } from 'frontend/api'

// blobTag - 'gallery', 'inline', ...
export async function getClipboardImage(blobTag: string) {
  // @ts-ignore
  const descriptor: PermissionDescriptor = { name: 'clipboard-read' }
  const result = await navigator.permissions.query(descriptor)

  if (result.state == 'granted' || result.state == 'prompt') {
    const allData = await navigator.clipboard.read()
    const data = allData[0]

    if (data.types.includes('image/png')) {
      const blob = await data.getType('image/png')
      const formData = new FormData()
      formData.append('image', blob, blobTag)

      return formData
    }
    throw new Error(`Missing clipboard handler`)
  }
  throw new Error('Failed to get clipboard permissions')
}

export const useUploadGallery = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ([leafId, formData]: Parameters<typeof fetchPostUploadGallery>) =>
      fetchPostUploadGallery(leafId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeNode'])
    },
  })
}

const useUpdateLeafContents = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leafId, content }: { leafId: number; content: string }) =>
      fetchPutUpdateLeafContents(leafId, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeNode'])
    },
  })
}


interface MonacoProps {
  leaf: LeafWithImages
  markdown: string
}
export default function Monaco({ leaf, markdown }: MonacoProps) {
  const editorRef = useRef<null | editor.IStandaloneCodeEditor>(null)

  const { stopLeafEditing } = useLeafStore(state => state.actions)

  const uploadGallery = useUploadGallery()
  const updateContents = useUpdateLeafContents()

  const handleMonacoPaste = async (e: ClipboardEvent<HTMLInputElement>) => {
    try {
      const formData = await getClipboardImage('inline')
      // const { path } = await uploadGallery.mutateAsync({ leafId: leaf.id, formData: formData })
      const { path } = await uploadGallery.mutateAsync([leaf.id, formData])
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
        if (content) updateContents.mutate({ content: content, leafId: leaf.id })
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
      if (content) updateContents.mutate({ content: content, leafId: leaf.id })
      stopLeafEditing(leaf.id)
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
