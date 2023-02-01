import { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { VariableSizeList, areEqual } from 'react-window'
import { createStyles, Group } from '@mantine/core'
import { useHotkeys, useResizeObserver } from '@mantine/hooks'
import { NodeWithSiblings, ChildNode } from 'backend/routes'
import { create } from 'zustand'

// https://codesandbox.io/s/github/vodkhang/react-pdf-viewer
// import * as pdfjs from 'pdfjs-dist/build/pdf'
// pdfjs.GlobalWorkerOptions.workerSrc =
//   'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.2.146/pdf.worker.min.js'

// @ts-ignore
const pdfjs = await import('pdfjs-dist/build/pdf')
// @ts-ignore
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry')

interface PdfStore {
  itemCount: number
  scale: number
  page: number
  pages: PDFPageProxy[]
  actions: {
    setItemCount: (itemCount: number) => void
    setScale: (scale: number) => void
    setPage: (page: number) => void
    setPages: (page: PDFPageProxy, index: number) => void
    clearPages: () => void
  }
}

const usePdfStore = create<PdfStore>(set => ({
  itemCount: 0,
  scale: 1,
  page: 1,
  pages: [],
  actions: {
    setItemCount: itemCount => set(() => ({ itemCount })),
    setScale: by => set(state => ({ scale: state.scale + by })),
    setPage: page => set(() => ({ page })),
    setPages: (page, index) =>
      set(state => {
        const prev = state.pages
        console.log(`SETTING PAGES: ${index + 1}/${prev.length}`)
        const next = [...prev]
        next[index] = page
        return { pages: next }
      }),
    clearPages: () => set(() => ({ pages: [] })),
  },
}))

const pdfContextInit = () => {
  const windowRef = useRef<VariableSizeList>() // <React.MutableRefObject<undefined>>
  const pdfRef = useRef<PDFDocumentProxy>()

  return { windowRef, pdfRef }
}

const PdfContext = createContext<ReturnType<typeof pdfContextInit> | undefined>(undefined)

const usePdfContext = () => {
  const pdfContext = useContext(PdfContext)
  if (!pdfContext) throw new Error('issue with context...')

  return pdfContext
}

const usePdfShortcuts = () => {
  const setScale = usePdfStore(store => store.actions.setScale)

  useHotkeys([
    [
      'shift+digit0',
      () => {
        console.log('shift-zero')
      },
    ],
    [
      'shift+minus',
      () => {
        setScale(-0.1)
        console.log('shift-minus')
      },
    ],
    [
      'shift+equal',
      () => {
        setScale(0.1)
        console.log('shift-plus')
      },
    ],
  ])
}

export default function PDF({ node }: { node: NodeWithSiblings }) {
  // var { pathname } = new URL(node.siblings.uri)
  // const url = `files/${pathname.split('/')[1]}`

  const filename = node.uri.split('/').pop()
  const url = `files/${filename}`
  console.log(`url is: ${url}`)
  usePdfShortcuts()

  return (
    <div className="App">
      <PdfContext.Provider value={pdfContextInit()}>
        <PDFWindow url={url} />
        <ProgressBar nodes={node.siblings.children} />
      </PdfContext.Provider>
    </div>
  )
}

function PDFWindow({ url }: { url: string }) {
  const setScale = usePdfStore(store => store.actions.setScale)

  return (
    <div className="App">
      <PdfUrlViewer url={url} />
    </div>
  )
}

const PdfPage = React.memo(({ page, scale }: { page: PDFPageProxy; scale: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!page) {
      console.log('PAGE MISSING!?')
      return
    }
    const viewport = page.getViewport({ scale })

    // Prepare canvas using PDF page dimensions
    const canvas = canvasRef.current
    if (canvas) {
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width

      // Render PDF page into canvas context
      const renderContext = {
        canvasContext: context!,
        viewport: viewport,
      }
      const renderTask = page.render(renderContext)
      renderTask.promise.then(function () {
        // console.log('Page rendered')
      })

      page.getTextContent().then(textContent => {
        // console.log(textContent);
        if (!textLayerRef.current) {
          return
        }

        // Pass the data to the method for rendering of text over the pdf canvas.
        pdfjs.renderTextLayer({
          textContent: textContent,
          container: textLayerRef.current,
          viewport: viewport,
          textDivs: [],
        })
      })
    } else {
      console.log('NO CANVAS!?')
    }
  }, [page, scale])

  return (
    <div className="PdfPage">
      <canvas ref={canvasRef} />
      <div ref={textLayerRef} className="PdfPage__textLayer" />
    </div>
  )
}, areEqual)

function PdfUrlViewer({ url }: { url: string }) {
  const { windowRef, pdfRef } = usePdfContext()
  const { setItemCount, clearPages } = usePdfStore(store => store.actions)

  useEffect(() => {
    var loadingTask: PDFDocumentLoadingTask = pdfjs.getDocument(url)
    loadingTask.promise.then(
      pdf => {
        console.log(`Reloading PDF with ${pdf._pdfInfo.numPages}`)
        pdfRef.current = pdf
        setItemCount(pdf._pdfInfo.numPages)

        // Fetch the first page
        var pageNumber = 1
        // setPages([])
        clearPages()
        pdf.getPage(pageNumber).then((page: PDFPageProxy) => {
          console.log('PAGE LOADED')
        })
      },
      reason => {
        // PDF loading error
        console.error(reason)
      }
    )
  }, [url])

  return <PdfViewer />
}

function PdfViewer() {
  const [ref, { width: internalWidth = 400, height: internalHeight = 600 }] = useResizeObserver()
  const { windowRef, pdfRef } = usePdfContext()
  const scale = usePdfStore(store => store.scale)
  const pages = usePdfStore(store => store.pages)
  const itemCount = usePdfStore(store => store.itemCount)
  const setPages = usePdfStore(store => store.actions.setPages)

  const fetchPage = useCallback(
    (index: number) => {
      if (!pages[index]) {
        pdfRef.current!.getPage(index + 1).then(page => {
          setPages(page, index)
          windowRef.current?.resetAfterIndex(index)
        })
      }
    },
    [pages]
  )

  const handleItemSize = useCallback(
    (index: number) => {
      const gap = 40
      const page = pages[index]
      return page ? page.getViewport({ scale }).height + gap : 50
    },
    [pages, scale]
  )

  const handleListRef = useCallback(
    (elem: VariableSizeList) => {
      windowRef.current = elem
    },
    [windowRef]
  )

  useEffect(() => {
    windowRef.current?.resetAfterIndex(0)
  }, [scale])

  const style = {
    width: '100%',
    height: '600px',
    border: '1px solid #ccc',
    background: '#ddd',
  }

  return (
    <div ref={ref} style={style}>
      <VariableSizeList
        ref={handleListRef}
        width={internalWidth}
        height={internalHeight}
        itemCount={itemCount}
        itemSize={handleItemSize}>
        {({ index, style }) => {
          fetchPage(index)
          return (
            <Page style={style}>
              <PdfPage page={pages[index]} scale={scale} />
            </Page>
          )
        }}
      </VariableSizeList>
    </div>
  )
}

const Page = React.memo(
  ({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) => {
    const internalStyle = {
      ...style,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      outline: '1px solid #ccc',
    }
    return <div style={internalStyle}>{children}</div>
  },
  areEqual
)

const useStyles = createStyles((theme, _params, getRef) => ({
  player: {},
  bar: {
    marginTop: '1rem',
    marginBottom: '1rem',
    borderBottom: '4px solid rgb(85, 79, 79)',
    position: 'relative',
  },
  point: {
    width: 16,
    height: 16,
    backgroundColor: '#b5afc4',
    borderRadius: '50%',
    position: 'absolute',
    left: '23%',
    top: -6,
    cursor: 'pointer',
  },
}))

function ProgressBar({ nodes }: { nodes: ChildNode[] }) {
  const { classes, cx } = useStyles()

  return (
    <div className={classes.bar}>
      {nodes.map(node => (
        <Point node={node} key={node.id} />
      ))}
    </div>
  )
}

function Point({ node }: { node: ChildNode }) {
  const { classes, cx } = useStyles()
  const { windowRef } = usePdfContext()
  const itemCount = usePdfStore(store => store.itemCount)

  var { searchParams } = new URL(node.uri)
  var page = parseInt(searchParams.get('p')!)

  const clickHandler = () => {
    console.log(`clicked on uri: ${node.uri} @ ${page} / ${itemCount}`)
    windowRef.current && windowRef.current.scrollToItem(page - 1, 'start')
    // setActiveNodeId(node.id)
  }

  const percent = Math.floor((page / itemCount) * 100)

  return <div className={classes.point} style={{ left: `${percent}%` }} onClick={clickHandler}></div>
}
