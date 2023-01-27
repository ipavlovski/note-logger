import { AspectRatio, createStyles, Popover, Portal, TextInput, Tooltip } from '@mantine/core'
import { getHotkeyHandler, useDisclosure, useHotkeys } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  CSSProperties,
  memo,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import YouTubePlayer from 'youtube-player'
import PlayerStates from 'youtube-player/dist/constants/PlayerStates'
import type { YouTubePlayer as YTPlayer } from 'youtube-player/dist/types'

import type { NodeWithSiblings, ChildNode } from 'backend/routes'
import { ORIGIN_URL, SERVER_URL } from 'components/app'
import { create, StateCreator } from 'zustand'
import { shallow } from 'zustand/shallow'
import { useActiveNodeStore } from 'components/node-list'

interface YoutubeStore {
  player: YTPlayer | null
  duration: number | null
  points: { ms: number }[]
  video: { nodeId: number; videoId: string } | null
  // siblingsId: number | null
  // videoId: string | null
  opened: boolean
  actions: {
    setPlayer: (player: YTPlayer) => void
    setDuration: (duration: number) => void
    setPoints: (point: { ms: number }) => void
    setVideo: (video: { nodeId: number; videoId: string }) => void
    // setSiblingsId: (siblingsId: number) => void
    setOpened: () => void
  }
}

export const useYoutubeStore = create<YoutubeStore>(set => ({
  player: null,
  duration: null,
  points: [],
  // siblingsId: null,
  video: null,
  opened: true,
  actions: {
    setPlayer: player => set(() => ({ player })),
    setDuration: duration => set(() => ({ duration })),
    setVideo: video => set(() => ({ video })),
    // setSiblingsId: siblingsId => set(() => ({ siblingsId })),
    setPoints: point => set(state => ({ points: [...state.points, point] })),
    setOpened: () => set(state => ({ opened: !state.opened })),
  },
}))

const useStyles = createStyles(theme => ({
  player: {
    padding: 0,
    ['& .ytp-pause-overlay']: {
      display: 'none',
    },
  },
  bar: {
    marginTop: '1rem',
    borderBottom: '5px solid rgb(85, 79, 79)',
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
  mainArea: {
    paddingBottom: 16,
  },
  savedPoint: {
    backgroundColor: '#779ad1',
  },
  activePoint: {
    backgroundColor: '#36843c',
  },
}))

const useShortcuts = () => {
  const player = useYoutubeStore(store => store.player)

  useHotkeys([
    [
      'space',
      async () => {
        const stateCode = await player?.getPlayerState()
        if (stateCode) {
          const status = Object.entries(PlayerStates).find(v => v[1] == stateCode)![0]

          if (status == 'PLAYING') player?.pauseVideo()
          if (status == 'PAUSED') player?.playVideo()
          if (status == 'VIDEO_CUED') showNotification({ color: 'teal', message: `QUEUED` })
        }
      },
    ],
  ])
}


function Player() {
  const { setDuration, setPlayer } = useYoutubeStore(state => state.actions)
  const youtubeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ytPlayer = YouTubePlayer(youtubeRef.current!, {
      videoId: 'iOTAFRFgm8I',
      playerVars: {
        enablejsapi: 1,
        origin: ORIGIN_URL,
        modestbranding: 1,
      },
    })

    ytPlayer.on('ready', () => {
      setPlayer(ytPlayer)
      ytPlayer.on('stateChange', async e => {
        const playerState: PlayerStates = await ytPlayer?.getPlayerState()
        const stateVal = Object.entries(PlayerStates).find(v => v[1] == playerState)
        console.log('STATE', playerState, stateVal![0])
      })
      ytPlayer.getDuration().then(d => setDuration(d))
    })

    // return () => {
    //   console.log('Destroying player...')
    //   player.destroy()
    // }
  }, [])

  return (
    <AspectRatio ratio={16 / 9} mx="auto" >
      <div ref={youtubeRef} />
    </AspectRatio>
  )
}



function ProgressBar({ nodes }: { nodes: ChildNode[] }) {
  const { classes, cx } = useStyles()
  // const { player, points, setPoints } = useContext(YoutubeContext)!

  const player = useYoutubeStore(state => state.player)
  const points = useYoutubeStore(state => state.points)
  const setPoints = useYoutubeStore(state => state.actions.setPoints)

  const addNewPoint = () => {
    if (player) {
      player.getCurrentTime().then(currentTime => {
        const ms = Math.round(currentTime * 1000) / 1000
        setPoints({ ms })
        console.log(`Created point at: ${ms} ms`)
      })
    }
  }

  return (
    <div className={classes.bar} onDoubleClick={addNewPoint}>
      {nodes.map(node => (
        <ExistingPoint node={node} key={node.id} />
      ))}
      {points.map(point => (
        <NewPoint ms={point.ms} key={point.ms} />
      ))}
    </div>
  )
}

function NewPoint({ ms }: { ms: number }) {
  const { classes, cx } = useStyles()
  const [isPopoverOpened, setPopoverOpened] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const queryClient = useQueryClient()

  const player = useYoutubeStore(state => state.player)
  const duration = useYoutubeStore(state => state.duration)
  const siblingsId = useYoutubeStore(state => state.video?.nodeId)

  const percent = Math.floor((ms / duration!) * 100)

  const addYoutubeChapter = useMutation(
    ({ nodeId, timestamp, title }: { nodeId: number; timestamp: number; title: string }) => {
      return fetch(`${SERVER_URL}/uri/${nodeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp, title }),
      })
    },
    {
      onSuccess: () => queryClient.invalidateQueries(['activeNode', 'nodeList']),
    }
  )

  const handleSave = () => {
    addYoutubeChapter.mutate({ nodeId: siblingsId!, timestamp: ms, title: titleValue })

    // IF success, or IF failure
    // IMPORTANT: remove the item from the list
    showNotification({
      title: `Status: ${addYoutubeChapter.status}`,
      color: 'teal',
      message: titleValue,
    })
    setPopoverOpened(false)
    setTitleValue('')
  }

  const clickOnNew = () => {
    setPopoverOpened(o => !o)
    player!.seekTo(ms, true)
    console.log(`clicked on ${ms}`)
  }

  return (
    <Popover
      opened={isPopoverOpened}
      width={300}
      position="bottom"
      onChange={setPopoverOpened}
      withArrow
      shadow="md">
      <Popover.Target>
        <div className={classes.point} style={{ left: `${percent}%` }} onClick={clickOnNew}></div>
      </Popover.Target>
      <Popover.Dropdown
        sx={theme => ({
          background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        })}>
        <TextInput
          placeholder="Title goes here."
          label="Press enter to submit..."
          value={titleValue}
          onChange={event => setTitleValue(event.target.value)}
          onKeyDown={getHotkeyHandler([['Enter', handleSave]])}
        />
      </Popover.Dropdown>
    </Popover>
  )
}

function ExistingPoint({ node }: { node: ChildNode }) {
  const { classes, cx } = useStyles()
  // const { duration, player } = useContext(YoutubeContext)!

  const player = useYoutubeStore(state => state.player)
  const duration = useYoutubeStore(state => state.duration)

  const { setActiveNodeId, activeNodeId } = useActiveNodeStore()

  const ms = parseFloat(new URL(node.uri).searchParams.get('ms')!)
  const percent = Math.floor((ms / duration!) * 100)

  const classList = cx(
    classes.point,
    classes.savedPoint,
    node.id == activeNodeId && classes.activePoint
  )

  const clickOnExisting = () => {
    console.log(`clicked on uri: ${node.uri} @ ${ms}`)
    player!.seekTo(ms, true)
    setActiveNodeId(node.id)
  }

  return (
    <Tooltip label={node.title}>
      <div className={classList} style={{ left: `${percent}%` }} onClick={clickOnExisting}></div>
    </Tooltip>
  )
}

export default function YouTube({ node }: { node: NodeWithSiblings }) {
  var { searchParams } = new URL(node.siblings.uri)
  var videoId = searchParams.get('v')!

  const player = useYoutubeStore(state => state.player)
  const setOpened = useYoutubeStore(state => state.actions.setOpened)

  const stuffHandler = () => {
    const el = document.querySelector<HTMLDivElement>('#youtube-portal')
    console.log(`display: ${el!.style.display}`)
    if (! el?.style.display ||  el!.style.display == 'block') {
      el!.style.display = 'none'
    } else {
      el!.style.display = 'block'
    }
  }

  const changeVid = () => {
      // console.log(player)
      player!.seekTo(120, true)
  }

  return (
    <div>
      {/* <Player videoId={videoId} siblingsId={node.siblings.id} /> */}
      {/* <ProgressBar nodes={node.siblings.children} /> */}
      <button style={{ margin: 8 }} onClick={stuffHandler}>
        STUFF
      </button>
      <button style={{ margin: 8 }} onClick={changeVid}>
        CHANGE VID
      </button>
    </div>
  )
}



export function YoutubePortal() {
  const opened = useYoutubeStore(state => state.opened)

  const css: CSSProperties = useMemo(() => ({
    position: 'absolute',
    width: 500,
    height: 500,
    top: 500,
    left: 50,
  }), [])

  return (
    <main style={{ position: 'relative', zIndex: 1 }}>
      {opened && (
        <Portal target="#youtube-portal" >
          <AspectRatio ratio={16 / 9} mx="auto" style={css}>
            <Player   />
          </AspectRatio>
        </Portal>
      )}
    </main>
  )
}

