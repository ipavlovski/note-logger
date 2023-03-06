import { showNotification } from '@mantine/notifications'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { ClipboardEvent, useRef } from 'react'
import { Observable, timer } from 'rxjs'
import { debounce } from 'rxjs/operators'

import { SERVER_URL, trpc, useActiveEntryStore } from 'components/app'
// import { useUpdateContentText, useUploadImage } from 'frontend/api'


async function getClipboardItem() {
  const result = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName })

  if (result.state == 'granted' || result.state == 'prompt') {
    const [data] = await navigator.clipboard.read()
    return data
  } else {
    throw new Error('Failed to get clipboard permissions')
  }
}


export default function Monaco({ height }: {height: number | string}) {
  const editorRef = useRef<null | editor.IStandaloneCodeEditor>(null)
  const markdown = useActiveEntryStore.getState().markdown
  const { setMarkdown, clearEntry } = useActiveEntryStore((state) => state.actions)
  const createOrUpdateEntry = trpc.createOrUpdateEntry.useMutation()

  const handleMonacoPaste = async (e: ClipboardEvent<HTMLInputElement>) => {
    try {
      const data = await getClipboardItem()

      // if (data.types.includes('image/png')) {
      //   const blob = await data.getType('image/png')
      //   const formData = new FormData()
      //   formData.append('image', blob, 'tmp-filename')
      //   const { path } = await uploadImage.mutateAsync(formData)
      //   path && editorRef.current!.trigger('keyboard', 'type', {
      //     text: `![](${SERVER_URL}/${path})`
      //   })
      //   e.stopPropagation()
      //   e.preventDefault()
      // }

      console.log('Handle image paste!')


    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
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

    new Observable((observer) => {
      editor.getModel()!.onDidChangeContent((event) => {
        observer.next(event)
      })
    })
      .pipe(debounce(() => timer(300)))
      .subscribe(() => {
        const content = editor.getValue()
        setMarkdown(content)
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
      if (content.length <= 3) {
        console.log('Too small to send POST request')
        return
      }
      createOrUpdateEntry.mutate({ markdown: content, id: useActiveEntryStore.getState().entryId })
      clearEntry()
      editor.setValue('')


    })
  }

  return (
    <Editor
      height={height}
      defaultLanguage="markdown"
      defaultValue={markdown}
      theme="vs-dark"
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
      options={{
        quickSuggestions: false, minimap: { enabled: false }, fontSize: 16, language: 'markdown'
      }}
    />
  )
}
