import React, { ClipboardEvent, useRef, useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import './index.css'
import Monaco, { editor } from 'monaco-editor'

import ReactMarkdown from 'react-markdown'
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, darcula } from 'react-syntax-highlighter/dist/esm/styles/prism'

import remarkGfm from 'remark-gfm'

import youTubePlayer from 'youtube-player'
import PlayerStates from 'youtube-player/dist/constants/PlayerStates'
import type { YouTubePlayer, Options } from 'youtube-player/dist/types'


const initmd = `
Here is some JavaScript code:

~~~js
console.log('It works!')
~~~

## hellow world 2
A paragraph with *emphasis* and **strong importance**.

> A block quote with ~strikethrough~ and a URL: https://reactjs.org.

* Lists
* [ ] todo
* [x] done

A table:

| a | b |
| - | - |
|data|df sf|
`




interface VideoNode {
  videoTitle: string
  videoId: string
  segments: Segment[]
}
type Segment = { seconds: number; title: string }

const videoNodes: VideoNode[] = [
  {
    videoTitle: 'some vid1',
    videoId: 'M7lc1UVf-VE',
    segments: [
      { seconds: 100, title: 'some stuff 1' },
      { seconds: 200, title: 'some stuff 2' },
      { seconds: 1300, title: 'some stuff 3' },
    ],
  },
  {
    videoTitle: 'some vid2',
    videoId: 'XxVg_s8xAms',
    segments: [
      { seconds: 150, title: 'other stuff 1' },
      { seconds: 250, title: 'other stuff 2' },
      { seconds: 350, title: 'other stuff 3' },
    ],
  },
]

function YouTube({ videoNode }: { videoNode: VideoNode }) {
  const [player, setPlayer] = useState<YouTubePlayer>()

  const youtubeRef = useRef<any>(null)

  useEffect(() => {
    const player = youTubePlayer(youtubeRef.current, {
      videoId: videoNode.videoId,
      playerVars: {
        enablejsapi: 1,
        origin: 'https://homelab:9001',
        modestbranding: 1,
      },
    })

    player.on('ready', () => {
      setPlayer(player)
      player.on('stateChange', async e => {
        
        const playerState: PlayerStates = await player?.getPlayerState()
        const stateVal = Object.entries(PlayerStates).find(v => v[1] == playerState)
        console.log('STATE', playerState, stateVal![0])      
      })
    })
  }, [])

  // player!.loadVideoById('M7lc1UVf-VE')
  const seekHandler1 = () => player!.seekTo(100, true)

  return (
    <>
      <div ref={youtubeRef} className='new-player' />
      <ProgressBar segments={videoNode.segments} player={player}></ProgressBar>
    </>
  )
}

interface ProgressBarProps {
  segments: Segment[]
  player: YouTubePlayer | undefined
}

function ProgressBar({ segments, player }: ProgressBarProps) {
  const [duration, setDuration] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(0)

  if (player) {
    player.getDuration().then(v => {
      console.log(`duration: ${v}`)
      setDuration(v)
    })
  }

  const handler = async () => {
    const duration = await player!.getDuration()
    const time = await player!.getCurrentTime()
    console.log(`progress: ${time}/${duration}`)
  }

  return (
    <div className='bar'>
      {segments.map(segment => {
        const left = (segment.seconds / duration) * 100
        return (
          <div
            onClick={() => {
              console.log(player)
              player!.seekTo(segment.seconds, true)
            }}
            className='point'
            key={segment.seconds}
            style={{ left: `${left}%` }}></div>
        )
      })}
    </div>
  )
}

function TreeNodes({ videoNodes }: { videoNodes: VideoNode[] }) {
  return (
    <>
      {videoNodes.map(videoNode => {
        return (
          <ul className='video-node' key={videoNode.videoId}>
            {videoNode.videoTitle}
            {videoNode.segments.map(segment => {
              return (
                <li className='segment-node' key={segment.seconds}>
                  {segment.title}
                </li>
              )
            })}
          </ul>
        )
      })}
    </>
  )
}







import Select, { StylesConfig } from "react-select"


function MyComponent() {
  const options = [
    { value: "chocolate", label: "Chocolate" },
    { value: "strawberry", label: "Strawberry" },
    { value: "vanilla", label: "Vanilla" },
    { value: "berry", label: "Berry" },
  ]

  const customStyles: StylesConfig = {
    menu: (provided: any, state: any) => ({
      ...provided,
      borderBottom: "4px dotted pink",
      color: state.selectProps.menuColor,
      padding: 20,
    }),
  }

  return (
    <div>
      <h2>Basic Styled</h2>
      <Select options={options} styles={customStyles} />
    </div>
  )
}









function CustomButton() {
  const [msg, setButtonText] = useState('test...')

  const fetchData = () => {
    const text = fetch('https://homelab:3002/select')
      .then(v => v.text())
      .then(t => {
        console.log('fetched text is: ', t)
        setButtonText(t)
      })
  }

  return (
    <>
      <button onClick={fetchData}>{msg}</button>
    </>
  )
}

function App() {
  const [markdown, setMarkdown] = useState(initmd)
  const editorRef = useRef<null | editor.IStandaloneCodeEditor>(null)

  const [imgURL, setImgURL] = useState('https://picsum.photos/420/320')

  const handleClipboardEvent = (e: ClipboardEvent<HTMLInputElement>) => {
    // @ts-ignore
    const descriptor: PermissionDescriptor = { name: 'clipboard-read' }

    navigator.permissions.query(descriptor).then(result => {
      // If permission to read the clipboard is granted or if the user will
      // be prompted to allow it, we proceed.

      if (result.state == 'granted' || result.state == 'prompt') {
        navigator.clipboard.read().then(data => {
          for (let i = 0; i < data.length; i++) {
            if (!data[i].types.includes('image/png')) {
              console.log('Clipboard contains non-image data. Unable to access it.')
            } else {
              data[i].getType('image/png').then(blob => {
                const url = URL.createObjectURL(blob)
                console.log('url:', url)
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
    const descriptor: PermissionDescriptor = { name: 'clipboard-read' }
    const result = await navigator.permissions.query(descriptor)

    if (result.state == 'granted' || result.state == 'prompt') {
      const allData = await navigator.clipboard.read()
      const data = allData[0]

      if (data.types.includes('image/png')) {
        const blob = await data.getType('image/png')
        const url = URL.createObjectURL(blob)
        console.log('url:', url)
        setImgURL(url)

        e.stopPropagation()
        e.preventDefault()
      }
    }
  }

  function handleEditorChange(value: string | undefined, event: editor.IModelContentChangedEvent) {
    if (value) setMarkdown(value)
  }

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: any) {
    // here is the editor instance
    // you can store it in `useRef` for further usage
    editorRef.current = editor
    // @ts-ignore
    editor.getDomNode()!.addEventListener('paste', handleMonacoPaste)
  }

  return (
    <div>
        <YouTube videoNode={videoNodes[0]} />
      <TreeNodes videoNodes={videoNodes} />
      <MyComponent />
      <CustomButton />
      <Editor
        height="30vh"
        defaultLanguage="markdown"
        defaultValue={initmd}
        theme="vs-dark"
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
      />

      <ReactMarkdown
        children={markdown}
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                children={String(children).replace(/\n$/, '')}
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
      <div>
        {/* enctype="image/png" */}
        <input type="text" onPasteCapture={handleClipboardEvent} />
      </div>
      <img src={imgURL} />
    </div>
  )
}

export default App
