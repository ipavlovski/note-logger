// https://codesandbox.io/s/github/vodkhang/react-pdf-viewer
// note:

// @ts-ignore
const pdfjs = await import('pdfjs-dist/build/pdf')
// @ts-ignore
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry')

// import * as pdfjs from 'pdfjs-dist/build/pdf'
// pdfjs.GlobalWorkerOptions.workerSrc =
//   'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.2.146/pdf.worker.min.js'

import { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { VariableSizeList } from 'react-window'
import { createStyles, MantineProvider } from '@mantine/core'
import { useResizeObserver } from '@mantine/hooks'
import { NodeWithSiblings } from 'backend/routes'

export default function PDF({ node }: { node: NodeWithSiblings }) {
  const [scale, setScale] = useState(1)
  const [page, setPage] = useState(1)
  const windowRef = useRef<VariableSizeList>() // <React.MutableRefObject<undefined>>

  // the URL is based on the vite proxy at the moment...
  const filename = node.uri.split('/').pop()
  const url = `files/${filename}`
  console.log(`url is: ${url}`)

  const scrollToItem = () => {
    windowRef.current && windowRef.current.scrollToItem(page, 'start')
  }

  useEffect(() => {
    //   pdfRef.current?.destroy()
    console.log(`RE-RENDERING THE COMPONENT for ${filename}`)
  }, [filename])

  return (
    <div className="App">
      <PdfUrlViewer url={url} scale={scale} windowRef={windowRef} />
      <button type="button" onClick={() => setScale(v => v + 0.1)}>
        +
      </button>
      <button type="button" onClick={() => setScale(v => v - 0.1)}>
        -
      </button>
      <input value={page} onChange={e => setPage(parseInt(e.target.value))} />
      <button type="button" onClick={scrollToItem}>
        goto
      </button>
    </div>
  )
}

type PageArgs = { children: React.ReactNode; style: React.CSSProperties }
const Page = React.memo(({ children, style }: PageArgs) => {
  const internalStyle = {
    ...style,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: '1px solid #ccc',
  }
  return <div style={internalStyle}>{children}</div>
})

const PdfPage = React.memo(({ page, scale }: { page: PDFPageProxy; scale: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!page) {
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
        // console.log("Page rendered");
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
    }
  }, [page, scale])

  return (
    <div className="PdfPage">
      <canvas ref={canvasRef} />
      <div ref={textLayerRef} className="PdfPage__textLayer" />
    </div>
  )
})

type PdfUrlViewerArgs = {
  url: string
  scale: number
  windowRef: React.MutableRefObject<VariableSizeList<any> | undefined>
}
const PdfUrlViewer = (props: PdfUrlViewerArgs) => {
  const { url, ...others } = props

  const pdfRef = useRef<PDFDocumentProxy>()

  const [itemCount, setItemCount] = useState(0)

  useEffect(() => {
    var loadingTask: PDFDocumentLoadingTask = pdfjs.getDocument(url)
    loadingTask.promise.then(
      pdf => {
        pdfRef.current = pdf

        setItemCount(pdf._pdfInfo.numPages)

        // Fetch the first page
        var pageNumber = 1
        pdf.getPage(pageNumber).then((page: PDFPageProxy) => {
          console.log(`Page ${page.pageNumber} loaded from total ${pdf.numPages}`)
        })
      },
      reason => {
        // PDF loading error
        console.error(reason)
      }
    )

  }, [url])

  const handleGetPdfPage = useCallback((index: number) => {
    return pdfRef.current!.getPage(index + 1)
  }, [])

  return <PdfViewer {...others} itemCount={itemCount} getPdfPage={handleGetPdfPage} />
}

interface PdfViewerArgs {
  width?: number | string
  height?: number | string
  scale?: number
  gap?: number
  itemCount: number
  getPdfPage: (index: number) => Promise<PDFPageProxy>
  windowRef: any
}

const PdfViewer = (props: PdfViewerArgs) => {
  const {
    width = '100%',
    height = '600px',
    scale = 1,
    gap = 40,
    itemCount,
    getPdfPage,
    windowRef,
  } = props

  const [pages, setPages] = useState<PDFPageProxy[]>([])

  const listRef = useRef<any>(null)

  const [ref, { width: internalWidth = 400, height: internalHeight = 600 }] = useResizeObserver()

  const fetchPage = useCallback(
    (index: number) => {
      if (!pages[index]) {
        getPdfPage(index).then(page => {
          setPages(prev => {
            const next = [...prev]
            next[index] = page
            return next
          })
          listRef.current?.resetAfterIndex(index)
        })
      }
    },
    [getPdfPage, pages]
  )

  const handleItemSize = useCallback(
    (index: number) => {
      const page = pages[index]
      return page ? page.getViewport({ scale }).height + gap : 50
    },
    [pages, scale, gap]
  )

  const handleListRef = useCallback(
    (elem: any) => {
      listRef.current = elem
      if (windowRef) {
        windowRef.current = elem
      }
    },
    [windowRef]
  )

  useEffect(() => {
    listRef.current?.resetAfterIndex(0)
  }, [scale])

  const style = {
    width,
    height,
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
