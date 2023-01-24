import { AspectRatio, createStyles, Popover, TextInput, Tooltip } from '@mantine/core'
import { getHotkeyHandler, useDisclosure, useHotkeys } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react'
import youTubePlayer from 'youtube-player'
import PlayerStates from 'youtube-player/dist/constants/PlayerStates'
import type { YouTubePlayer } from 'youtube-player/dist/types'

import type { NodeWithSiblings, ChildNode } from 'backend/routes'
import { AppState, ORIGIN_URL, SERVER_URL, useAppStore } from 'components/app'
import { StateCreator } from 'zustand'
import { PdfPreview } from 'components/pdf'
import { shallow } from 'zustand/shallow'
//  =============================
//              STATE
//  =============================





interface ThumbnailPreview {
  type: 'thumbnail'
}


export interface PreviewSlice {
  preview: YoutubePreview | PdfPreview | ThumbnailPreview
}

export const createPreviewSlice: StateCreator<AppState, [], [], PreviewSlice> = (set, get) => ({
  preview: {
    type: 'youtube',
    player: null,
    duration: null,
    points: [],
    siblingsId: null,
    // setType: type => set(state => ({ preview: { ...state.preview, type }})),
    setPlayer: player => set(state => ({ preview: { ...state.preview, player }})),
    setDuration: duration => set(state => ({ preview: { ...state.preview, duration }})),
    setSiblingsId: siblingsId => set(state => ({ preview: { ...state.preview, siblingsId }})),
    setPoints: point => set(state => ({ preview: { ...state.preview, points: [point] }})),
  }
})

export interface YoutubePreview {
  type: 'youtube'
  player: YouTubePlayer | null
  duration: number | null
  points: {ms: number}[]
  siblingsId: number | null,
  // setType: (type: 'youtube' | 'pdf') => void
  setPlayer: (player: YouTubePlayer) => void
  setDuration: (duration: number) => void
  setPoints: (point: {ms: number}) => void
  setSiblingsId: (siblingsId: number) => void
}


// const useStateDef = () => {
//   const [player, setPlayer] = useState<YouTubePlayer>()
//   const [duration, setDuration] = useState<number>()
//   const [points, setPoints] = useState<{ ms: number }[]>([])
//   const [siblingsId, setSiblingsId] = useState<number>()

//   return { player, setPlayer, duration, setDuration, points, setPoints, siblingsId, setSiblingsId }
// }

// const YoutubeContext = createContext<ReturnType<typeof useStateDef> | undefined>(undefined)


//  =============================
//              HOOKS
//  =============================

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
  // const { player } = useContext(YoutubeContext)!
  const player = useAppStore(state => {
    if (state.preview.type != 'youtube') throw new Error('Should not have happened...')
    return state.preview.player
  })

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

//  ============================
//              MAIN
//  ============================


export default function YouTube({ node }: { node: NodeWithSiblings }) {
  var { searchParams } = new URL(node.siblings.uri)
  var videoId = searchParams.get('v')!


  const { setDuration, setPlayer, setSiblingsId } = useAppStore(state => {
    if (state.preview.type != 'youtube') throw new Error('Should not have happened...')
    return {
      setDuration: state.preview.setDuration,
      setPlayer: state.preview.setPlayer,
      setSiblingsId: state.preview.setSiblingsId,
    }
  }, shallow)

  return (
    // <YoutubeContext.Provider value={useStateDef()}>
    <div>
      <Player videoId={videoId} siblingsId={node.siblings.id} />
      <ProgressBar nodes={node.siblings.children} />
    </div>

    // </YoutubeContext.Provider>
  )
}

function Player({ videoId, siblingsId }: { videoId: string, siblingsId: number }) {
  const { classes } = useStyles()
  const { setDuration, setPlayer, setSiblingsId } = useAppStore(state => {
    if (state.preview.type != 'youtube') throw new Error('Should not have happened...')
    return {
      setDuration: state.preview.setDuration,
      setPlayer: state.preview.setPlayer,
      setSiblingsId: state.preview.setSiblingsId,
    }
  }, shallow)

  // const { setDuration, setPlayer, setSiblingsId } = useContext(YoutubeContext)!
  setSiblingsId(siblingsId)
  useShortcuts()

  const youtubeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const player = youTubePlayer(youtubeRef.current!, {
      videoId: videoId,
      playerVars: {
        enablejsapi: 1,
        origin: ORIGIN_URL,
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
      player.getDuration().then(d => setDuration(d))
    })

    return () => {
      console.log('Destroying player...')
      player.destroy()
    }
  }, [videoId])

  return (
    <AspectRatio ratio={16 / 9} mx="auto" className={classes.player}>
      <div ref={youtubeRef} className={classes.player} />
    </AspectRatio>
  )
}

function ProgressBar({ nodes }: { nodes: ChildNode[] }) {
  const { classes, cx } = useStyles()
  // const { player, points, setPoints } = useContext(YoutubeContext)!

  const { player, points, setPoints } = useAppStore(state => {
    if (state.preview.type != 'youtube') throw new Error('Should not have happened...')
    return {
      player: state.preview.player,
      points: state.preview.points,
      setPoints: state.preview.setPoints,
    }
  }, shallow)


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


//  ==============================
//              POINTS            
//  ==============================



function NewPoint({ ms }: { ms: number }) {
  const { classes, cx } = useStyles()
  const [isPopoverOpened, setPopoverOpened] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const queryClient = useQueryClient()
  // const { duration, player, siblingsId } = useContext(YoutubeContext)!

  const { duration, player,siblingsId } = useAppStore(state => {
    if (state.preview.type != 'youtube') throw new Error('Should not have happened...')
    return {
      duration: state.preview.duration,
      player: state.preview.player,
      siblingsId: state.preview.siblingsId,
    }
  }, shallow)

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
    showNotification({ title: `Status: ${addYoutubeChapter.status}`, color: 'teal', message: titleValue })
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

  const { duration, player } = useAppStore(state => {
    if (state.preview.type != 'youtube') throw new Error('Should not have happened...')
    return {
      duration: state.preview.duration,
      player: state.preview.player,
    }
  }, shallow)

  const setActiveNode = useAppStore(state => state.setActive)
  const activeNode = useAppStore(state => state.active)

  const ms = parseFloat(new URL(node.uri).searchParams.get('ms')!)
  const percent = Math.floor((ms / duration!) * 100)

  const classList = cx(
    classes.point,
    classes.savedPoint,
    node.id == activeNode && classes.activePoint
  )

  const clickOnExisting = () => {
    console.log(`clicked on uri: ${node.uri} @ ${ms}`)
    player!.seekTo(ms, true)
    setActiveNode(node.id)
  }

  return (
    <Tooltip label={node.title}>
      <div className={classList} style={{ left: `${percent}%` }} onClick={clickOnExisting}></div>
    </Tooltip>
  )
}
