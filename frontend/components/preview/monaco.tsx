import { showNotification } from '@mantine/notifications'
import Editor, { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useRef } from 'react'
import { Observable, timer } from 'rxjs'
import { debounce } from 'rxjs/operators'

import ClipboardHandler from 'frontend/apis/clipboard'
import { useCaptureMedia, useCreateEntry, useUpdateEntry } from 'frontend/apis/queries'
import { useActiveEntryStore, useMillerStore } from 'frontend/apis/stores'
import { SERVER_URL } from 'frontend/apis/utils'


export default function MonacoEditor({ height }: {height: number | string}) {
  const editorRef = useRef<null | editor.IStandaloneCodeEditor>(null)
  const markdown = useActiveEntryStore.getState().markdown
  const { setMarkdown, clearEntry } = useActiveEntryStore((state) => state.actions)

  const createEntry = useCreateEntry()
  const updateEntry = useUpdateEntry()
  const captureMedia = useCaptureMedia()

  const handleMonacoPaste = async (e: globalThis.ClipboardEvent) => {

    try {
      const clipboard = await ClipboardHandler.create()
      const base64 = await clipboard.getImage() || await clipboard.getVideo()

      if (base64) {
        e.stopPropagation()
        e.preventDefault()

        const filename = await captureMedia.mutateAsync(base64)
        if (! filename) throw new Error('Failed to get proper filename back')

        const extension = filename.split('.').pop()
        let text = ''
        switch (extension) {
          case 'mp4':
            text = `::video{filename="capture/${filename}"}`
            break
          case 'png':
          case 'jpeg':
            text = `![](${SERVER_URL}/capture/${filename})`
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

      const content = editor.getValue()
      if (content.length <= 3) {
        console.log('Too small to send POST request')
        return
      }

      const entryId = useActiveEntryStore.getState().entryId

      const [firstId, secondId, thirdId] = useMillerStore.getState().selection
      const nodeId = firstId && secondId && thirdId ? thirdId :
        firstId && secondId ? secondId : firstId ? firstId : null

      entryId != null ? updateEntry.mutate({ entryId, markdown: content }, {
        onSuccess: () => {
          clearEntry()
          editor.setValue('')
        }
      }) : nodeId != null ? createEntry.mutate({ nodeId, markdown: content }, {
        onSuccess: () => {
          clearEntry()
          editor.setValue('')
        }
      }) : showNotification({ title: 'ctrl+v', message: 'Failed to save entry.', color: 'yellow' })

    })

    editor.addCommand(monaco.KeyCode.Escape, () => {
      console.log('escape')


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
