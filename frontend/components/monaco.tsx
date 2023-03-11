import { showNotification } from '@mantine/notifications'
import Editor, { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useRef } from 'react'
import { Observable, timer } from 'rxjs'
import { debounce } from 'rxjs/operators'

import { SERVER_URL, trpc, useActiveEntryStore } from 'components/app'


export default function MonacoEditor({ height }: {height: number | string}) {
  const editorRef = useRef<null | editor.IStandaloneCodeEditor>(null)
  const markdown = useActiveEntryStore.getState().markdown
  const { setMarkdown, clearEntry } = useActiveEntryStore((state) => state.actions)

  const utils = trpc.useContext()
  const createOrUpdateEntry = trpc.createOrUpdateEntry.useMutation({
    onSuccess: () => {
      utils.getEntries.invalidate()
    }
  })
  const uploadBase64File = trpc.uploadBase64File.useMutation()

  const handleMonacoPaste = async (e: globalThis.ClipboardEvent) => {

    try {
      const clipboardText = e.clipboardData?.getData('Text') || ''
      const indNewLine = clipboardText.indexOf('\n')
      const firstLine = clipboardText.substring(0, indNewLine)
      const restLines = clipboardText.substring(indNewLine + 1)
      const isBase64 = /^data:.*:base64/.test(firstLine)

      if (isBase64) {
        e.stopPropagation()
        e.preventDefault()

        const { filename } = await uploadBase64File.mutateAsync({ base64: restLines })
        if (! filename) throw new Error('Failed to get proper filename back')

        const extension = filename.split('.').pop()
        let text = ''
        switch (extension) {
          case 'mp4':
            text = `::video{filename="${filename}"}`
            break
          case 'png':
            text = `![](${SERVER_URL}/${filename})`
            break
          default:
            throw new Error(`Unknown extension: ${extension}`)
        }

        filename && editorRef.current!.trigger('keyboard', 'type', { text })
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      showNotification({ title: 'ctrl+v', message: msg, color: 'red', autoClose: 1600 })
    }
  }

  // this function has to be  here
  function handleEditorChange(value: string | undefined, event: editor.IModelContentChangedEvent) {}

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
    editorRef.current = editor
    editor.getContainerDomNode().addEventListener('paste', handleMonacoPaste, true)

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
