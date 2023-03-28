import { showNotification } from '@mantine/notifications'
import Editor, { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useRef } from 'react'
import { Observable, timer } from 'rxjs'
import { debounce } from 'rxjs/operators'

import { useCreateEntry, useUpdateEntry } from 'frontend/apis/queries'
import { create } from 'zustand'


interface ActiveEntryStore {
  entryId: number | null
  markdown: string
  actions: {
    setMarkdown: (markdown: string) => void
    setEntry: (entryId: number | null, markdown: string) => void
    clearEntry: () => void
  }
}

const getLocalEntry = () => {
  const entry = localStorage.getItem('entry')
  return entry ?
    JSON.parse(entry) as { entryId: number | null, markdown: string} :
    { entryId: null, markdown: '' }
}

const setLocalEntry = (entryId: number | null, markdown: string) => {
  localStorage.setItem('entry', JSON.stringify({ entryId, markdown }))
  return { entryId, markdown }
}


export const useActiveEntryStore = create<ActiveEntryStore>((set) => ({
  entryId: getLocalEntry().entryId,
  markdown: getLocalEntry().markdown,
  actions: {
    setMarkdown: (markdown) => set((state) => setLocalEntry(state.entryId, markdown)),
    clearEntry: () => set(() => setLocalEntry(null, '')),
    setEntry: (entryId, markdown) => set(() => setLocalEntry(entryId, markdown))
  },
}))


export default function MonacoEditor({ height }: {height: number | string}) {
  const editorRef = useRef<null | editor.IStandaloneCodeEditor>(null)
  const markdown = useActiveEntryStore.getState().markdown
  const { setMarkdown, clearEntry } = useActiveEntryStore((state) => state.actions)

  const createEntry = useCreateEntry()
  const updateEntry = useUpdateEntry()
  // const activeNode = useCachedActiveNode()
  // const queryCache = useQueryCache()


  // const uploadBase64File = trpc.uploadBase64File.useMutation()

  const handleMonacoPaste = async (e: globalThis.ClipboardEvent) => {

    try {

      // const clipboardText = e.clipboardData?.getData('Text') || ''
      // const indNewLine = clipboardText.indexOf('\n')
      // const firstLine = clipboardText.substring(0, indNewLine)
      // const restLines = clipboardText.substring(indNewLine + 1)
      // const isBase64 = /^data:.*:base64/.test(firstLine)

      // if (isBase64) {
      //   e.stopPropagation()
      //   e.preventDefault()

      //   const { filename } = await uploadBase64File.mutateAsync({ base64: restLines })
      //   if (! filename) throw new Error('Failed to get proper filename back')

      //   const extension = filename.split('.').pop()
      //   let text = ''
      //   switch (extension) {
      //     case 'mp4':
      //       text = `::video{filename="${filename}"}`
      //       break
      //     case 'png':
      //       text = `![](${SERVER_URL}/${filename})`
      //       break
      //     default:
      //       throw new Error(`Unknown extension: ${extension}`)
      //   }

      //   filename && editorRef.current!.trigger('keyboard', 'type', { text })
      // }

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
      const nodeId = undefined


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
