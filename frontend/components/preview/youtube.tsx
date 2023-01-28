import {
  AspectRatio,
  createStyles,
  Image,
  Popover,
  Skeleton,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { getHotkeyHandler, usePrevious } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import type { Preview as IPreview } from '@prisma/client'
import { useEffect, useLayoutEffect, useState } from 'react'
import type { YouTubePlayer as YTPlayer } from 'youtube-player/dist/types'
import { create } from 'zustand'

import type { ChildNode, NodeWithSiblings } from 'backend/routes'
import { SERVER_URL } from 'components/app'
import { useActiveNodeStore } from 'components/node-list'
import {
  useResizeYoutube,
  useYoutubeControls,
  useYoutubeShortcuts,
  useYoutubeVisible,
} from 'components/preview/youtube-portal'
import { usePostUriWithChildMutation } from 'frontend/api'

interface YoutubeStore {
  player: YTPlayer | null
  duration: number | null
  points: { ms: number }[]
  video: { nodeId: number; videoId: string } | null
  opened: boolean
  actions: {
    setPlayer: (player: YTPlayer) => void
    setDuration: (duration: number) => void
    setPoints: (point: { ms: number }) => void
    setVideo: (video: { nodeId: number; videoId: string }) => void
    setOpened: () => void
  }
}

export const useYoutubeStore = create<YoutubeStore>(set => ({
  player: null,
  duration: null,
  points: [],
  video: null,
  opened: true,
  actions: {
    setPlayer: player => set(() => ({ player })),
    setDuration: duration => set(() => ({ duration })),
    setVideo: video => set(() => ({ video })),
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

function ProgressBar({ nodes }: { nodes: ChildNode[] }) {
  const { classes, cx } = useStyles()

  const points = useYoutubeStore(state => state.points)
  const setPoints = useYoutubeStore(state => state.actions.setPoints)

  const controls = useYoutubeControls()
  if (controls == null) return <div className={classes.bar} />

  const addNewPoint = () => {
    controls.getPosition().then(currentTime => setPoints({ ms: currentTime }))
  }

  return (
    <div className={classes.bar} onDoubleClick={addNewPoint}>
      {nodes.map(node => (
        <ExistingPoint childNode={node} key={node.id} />
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

  const controls = useYoutubeControls()
  if (controls == null) return null

  const duration = useYoutubeStore(state => state.duration)
  const siblingsId = useYoutubeStore(state => state.video!.nodeId!)
  const addYoutubeChapter = usePostUriWithChildMutation()

  const percent = Math.floor((ms / duration!) * 100)

  const handleSave = () => {
    addYoutubeChapter.mutate([siblingsId, ms, titleValue])
    showNotification({ color: 'teal', message: titleValue })
    setPopoverOpened(false)
    setTitleValue('')
  }

  const clickOnNew = () => {
    setPopoverOpened(o => !o)
    controls.seekTo(ms)
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

function ExistingPoint({ childNode }: { childNode: ChildNode }) {
  const { classes, cx } = useStyles()

  const { setActiveNodeId, activeNodeId } = useActiveNodeStore()

  const controls = useYoutubeControls()
  if (controls == null) return null

  const duration = useYoutubeStore(state => state.duration)

  const ms = parseFloat(new URL(childNode.uri).searchParams.get('ms')!)
  const percent = Math.floor((ms / duration!) * 100)

  const classList = cx(
    classes.point,
    classes.savedPoint,
    childNode.id == activeNodeId && classes.activePoint
  )

  const clickOnExisting = () => {
    controls.seekTo(ms)
    setActiveNodeId(childNode.id)
  }

  return (
    <Tooltip label={childNode.title}>
      <div className={classList} style={{ left: `${percent}%` }} onClick={clickOnExisting}></div>
    </Tooltip>
  )
}

function Thumbnail({ preview }: { preview: IPreview | null }) {
  const ref = useResizeYoutube()

  return (
    <AspectRatio ref={ref} ratio={16 / 9} mx="auto">
      {preview ? (
        <Image radius={'md'} src={`${SERVER_URL}/${preview.path}`} />
      ) : (
        <Skeleton animate={false} radius="lg" />
      )}
    </AspectRatio>
  )
}

export default function YouTube({ node }: { node: NodeWithSiblings }) {
  const { openYoutube, closeYoutube } = useYoutubeVisible()

  useYoutubeShortcuts()
  const controls = useYoutubeControls()
  if (controls == null) return null

  useEffect(() => {
    const { searchParams } = new URL(node.siblings.uri)
    const videoId = searchParams.get('v')!
    controls.cueVideo(videoId)
  }, [node.siblings.uri])

  useEffect(() => {
    openYoutube()
    return () => {
      closeYoutube()
    }
  }, [])

  return (
    <div>
      <Thumbnail preview={node.preview} />
      <ProgressBar nodes={node.siblings.children} />
    </div>
  )
}
