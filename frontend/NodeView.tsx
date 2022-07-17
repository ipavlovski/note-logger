import { NodeWithProps } from "common/types"
import { NodeContext } from "frontend/App"
import { ClipboardEvent, useContext, useEffect, useRef, useState } from "react"
import Editor from "@monaco-editor/react"
import { editor } from "monaco-editor"
import ReactMarkdown from "react-markdown"
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkGfm from "remark-gfm"

function Leaf(props: any) {
  const initmd = props.node.content
  const [markdown, setMarkdown] = useState(initmd)
  const editorRef = useRef<null | editor.IStandaloneCodeEditor>(null)

  const [imgURL, setImgURL] = useState("https://picsum.photos/420/320")

  const handleClipboardEvent = (e: ClipboardEvent<HTMLInputElement>) => {
    // @ts-ignore
    const descriptor: PermissionDescriptor = { name: "clipboard-read" }

    navigator.permissions.query(descriptor).then((result) => {
      // If permission to read the clipboard is granted or if the user will
      // be prompted to allow it, we proceed.

      if (result.state == "granted" || result.state == "prompt") {
        navigator.clipboard.read().then((data) => {
          for (let i = 0; i < data.length; i++) {
            if (!data[i].types.includes("image/png")) {
              console.log(
                "Clipboard contains non-image data. Unable to access it."
              )
            } else {
              data[i].getType("image/png").then((blob) => {
                const url = URL.createObjectURL(blob)
                console.log("url:", url)
                setImgURL(url)
              })
            }
          }
        })
      }
    })
  }

  const handleMonacoPaste = async (e: ClipboardEvent<HTMLInputElement>) => {
    // @ts-ignore
    const descriptor: PermissionDescriptor = { name: "clipboard-read" }
    const result = await navigator.permissions.query(descriptor)

    if (result.state == "granted" || result.state == "prompt") {
      const allData = await navigator.clipboard.read()
      const data = allData[0]

      if (data.types.includes("image/png")) {
        const blob = await data.getType("image/png")
        const url = URL.createObjectURL(blob)
        console.log("url:", url)
        setImgURL(url)

        e.stopPropagation()
        e.preventDefault()
      }
    }
  }

  function handleEditorChange(
    value: string | undefined,
    event: editor.IModelContentChangedEvent
  ) {
    if (value) setMarkdown(value)
  }

  function handleEditorDidMount(
    editor: editor.IStandaloneCodeEditor,
    monaco: any
  ) {
    // here is the editor instance
    // you can store it in `useRef` for further usage
    editorRef.current = editor
    // @ts-ignore
    editor.getDomNode()!.addEventListener("paste", handleMonacoPaste)
  }

  const [isEditing, setEditing] = useState(false)

  return (
    <div onDoubleClick={() => setEditing(true)}>
      {isEditing ? (
        <Editor
          height="30vh"
          defaultLanguage="markdown"
          defaultValue={initmd}
          theme="vs-dark"
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
        />
      ) : (
        
        <ReactMarkdown
          children={markdown}
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "")
              return !inline && match ? (
                <SyntaxHighlighter
                  children={String(children).replace(/\n$/, "")}
                  // @ts-ignore
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                />
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            },
          }}
        />
      )}
      <p>{props.node.createdAt}</p>
      
    </div>
  )
}

// AT THE END OF MONACO - example of clipboard-catching div
// <div>
// {/* enctype="image/png" */}
// <input type="text" onPasteCapture={handleClipboardEvent} />
// </div>
// <img src={imgURL} />

function NodeView() {
  const [context, _] = useContext(NodeContext)

  const [node, setNode] = useState<NodeWithProps>()

  const fetchNode = async (nodeId: number) => {
    const url = `https://localhost:3002/node/${nodeId}`
    return await fetch(url).then((v) => v.json())
  }

  useEffect(() => {
    if (context != null) {
      console.log(`setting context: ${context}`)
      fetchNode(context).then((v) => setNode(v))
    }
  }, [context])

  const createNewEditor = () => {
    console.log("create new editor!")
  }

  return (
    <>
      <div style={{ gridArea: "preview" }}>
        <h1>{node?.title}</h1>
      </div>
      <div style={{ gridArea: "leafs" }}>
        {node?.leafs?.length == 0 ? (
          <h2>empty</h2>
        ) : (
          node?.leafs.map((leaf) => {
            return <Leaf key={leaf.id} node={leaf} />
          })
        )}
        <h3 onClick={createNewEditor}> -------------- + ----------- </h3>
      </div>
    </>
  )
}

export default NodeView
