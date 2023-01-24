import { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { VariableSizeList, areEqual } from 'react-window'
import { createStyles, Group } from '@mantine/core'
import { useResizeObserver } from '@mantine/hooks'
import { NodeWithSiblings, ChildNode } from 'backend/routes'

// https://codesandbox.io/s/github/vodkhang/react-pdf-viewer
// import * as pdfjs from 'pdfjs-dist/build/pdf'
// pdfjs.GlobalWorkerOptions.workerSrc =
//   'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.2.146/pdf.worker.min.js'


// @ts-ignore
const pdfjs = await import('pdfjs-dist/build/pdf')
// @ts-ignore
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry')


export interface PdfPreview {
  type: 'pdf'
  windowRef: React.MutableRefObject<VariableSizeList<any> | undefined>
  setWindowRef: (ref: React.MutableRefObject<VariableSizeList<any>>) => void
  pdfRef: React.MutableRefObject<PDFDocumentProxy | undefined>
  setPdfRef: (ref: React.MutableRefObject<PDFDocumentProxy>) => void
  itemCount: number,
  setItemCount: (itemCount: number) => void
  scaleCount: number,
  setScaleCount: (scaleCount: number) => void
  pageCount: number,
  setPageCount: (pageCount: number) => void
  pages: PDFPageProxy[]
  setPages: (pages: PDFPageProxy[]) => void
}

const useStateDef = () => {
  const windowRef = useRef<VariableSizeList>() // <React.MutableRefObject<undefined>>
  const pdfRef = useRef<PDFDocumentProxy>()
  const [itemCount, setItemCount] = useState(0)
  const [scale, setScale] = useState(1)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState<PDFPageProxy[]>([])

  return {
    pdfRef,
    itemCount,
    setItemCount,
    scale,
    setScale,
    page,
    setPage,
    windowRef,
    pages,
    setPages,
  }
}

const PdfContext = createContext<ReturnType<typeof useStateDef> | undefined>(undefined)

export default function PDF({ node }: { node: NodeWithSiblings }) {
  // var { pathname } = new URL(node.siblings.uri)
  // const url = `files/${pathname.split('/')[1]}`

  const filename = node.uri.split('/').pop()
  const url = `files/${filename}`
  console.log(`url is: ${url}`)

  return (
    <div className="App">
      <PdfContext.Provider value={useStateDef()}>
        <ProgressBar nodes={node.siblings.children} />
        <PDFWindow url={url} />
      </PdfContext.Provider>
    </div>
  )
}

function PDFWindow({ url }: { url: string }) {
  const { setScale, windowRef, pdfRef, setPages, pages } = useContext(PdfContext)!

  useEffect(() => {
    
    return () => {
      // windowRef.current?.resetAfterIndex(0)
      // pdfRef.current?.destroy()
    }
  }, [url])

  return (
    <div className="App">
      <Group>
        <button type="button" onClick={() => setScale((v) => v + 0.1)}>
          +
        </button>
        <button type="button" onClick={() => setScale((v) => v - 0.1)}>
          -
        </button>
        <button
          onClick={() => {
            console.log(pages)
          }}
        >
          show pages
        </button>
      </Group>
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

      page.getTextContent().then((textContent) => {
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
  const { windowRef, pdfRef, itemCount, setItemCount, setPages } = useContext(PdfContext)!

  useEffect(() => {
    var loadingTask: PDFDocumentLoadingTask = pdfjs.getDocument(url)
    loadingTask.promise.then(
      (pdf) => {

        console.log(`Reloading PDF with ${pdf._pdfInfo.numPages}`)
        pdfRef.current = pdf
        setItemCount(pdf._pdfInfo.numPages)

        // Fetch the first page
        var pageNumber = 1
        setPages([])
        pdf.getPage(pageNumber).then((page: PDFPageProxy) => {
          console.log('PAGE LOADED')
        })
      },
      (reason) => {
        // PDF loading error
        console.error(reason)
      }
    )
  }, [url])

  return <PdfViewer />
}

function PdfViewer() {
  // const [pages, setPages] = useState<PDFPageProxy[]>([])
  // const listRef = useRef<any>(null)
  const [ref, { width: internalWidth = 400, height: internalHeight = 600 }] = useResizeObserver()
  const { windowRef, pdfRef, itemCount, scale, pages, setPages } = useContext(PdfContext)!

  const fetchPage = useCallback(
    (index: number) => {
      if (!pages[index]) {
        pdfRef.current!.getPage(index + 1).then((page) => {
          setPages((prev) => {
            console.log(`SETTING PAGES: ${index+1}/${pages.length}`)
            const next = [...prev]
            next[index] = page
            return next
          })
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
        itemSize={handleItemSize}
      >
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
      {nodes.map((node) => (
        <Point node={node} key={node.id} />
      ))}
    </div>
  )
}

function Point({ node }: { node: ChildNode }) {
  const { classes, cx } = useStyles()
  const { windowRef, itemCount } = useContext(PdfContext)!
  // const setActiveNodeId = useAppStore((state) => state.setActiveNodeId)

  var { searchParams } = new URL(node.uri)
  var page = parseInt(searchParams.get('p')!)

  const clickHandler = () => {
    console.log(`clicked on uri: ${node.uri} @ ${page} / ${itemCount}`)
    windowRef.current && windowRef.current.scrollToItem(page - 1, 'start')
    // setActiveNodeId(node.id)
  }

  const percent = Math.floor((page / itemCount) * 100)

  return (
    <div className={classes.point} style={{ left: `${percent}%` }} onClick={clickHandler}></div>
  )
}
