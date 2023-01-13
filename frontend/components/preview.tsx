import { AspectRatio, createStyles, Image, Popover, Skeleton, TextInput } from '@mantine/core'
import type { Preview as IPreview } from '@prisma/client'

import { useAppStore } from 'components/app'

const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`

import { useEffect, useRef, useState } from 'react'
import youTubePlayer from 'youtube-player'
import PlayerStates from 'youtube-player/dist/constants/PlayerStates'
import type { YouTubePlayer } from 'youtube-player/dist/types'

const useStyles = createStyles(theme => ({
  selected: {
    padding: 2,
    borderRadius: `${theme.radius.md}px`,
    border: '2px solid #dfcc43',
  },
  preview: {
    userSelect: 'none',
  },
  hidden: {
    display: 'none',
  },
  refresh: {
    width: 36,
    height: 36,
    cursor: 'pointer',
    color: theme.colors.dark[1],
    ':hover': {
      color: theme.colors.dark[0],
    },
  },

  player: {
    padding: 1,
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
}))

export default function Preview({
  nodeId,
  preview,
  uri,
}: {
  nodeId: number
  preview: IPreview | null
  uri: string
}) {
  const togglePreviewSelect = useAppStore(state => state.togglePreviewSelect)
  const selectedPreview = useAppStore(state => state.selection.preview)

  const { classes, cx } = useStyles()

  return ! uri.startsWith('https://www.youtube.com/watch') ? (
    <AspectRatio
      ratio={16 / 9}
      mx="auto"
      className={cx(classes.preview, selectedPreview && classes.selected)}
      onClick={event => {
        // when shift is pressed, toggle selection of the element
        event.shiftKey && togglePreviewSelect()
        // this prevents residual selects when shift is pressed
        event.preventDefault()
      }}>
      {preview ? (
        <Image radius={'md'} src={`${SERVER_URL}/${preview.path}`} />
      ) : (
        <Skeleton animate={false} radius="lg" />
      )}
    </AspectRatio>
  ) : (
    <YouTube />
  )
}

// https://www.youtube.com/watch?v=AHYNxpqKqwo
// { videoNode }: { videoNode: VideoNode }
function YouTube() {
  const [player, setPlayer] = useState<YouTubePlayer>()
  const [duration, setDuration] = useState<number>()
  const [timestamps, append] = useState<number[]>([])

  const youtubeRef = useRef<any>(null)
  const { classes, cx } = useStyles()

  // const timestamps = useAppStore((state) => state.timestamps)
  // const append = useAppStore((state) => state.append)

  useEffect(() => {
    const player = youTubePlayer(youtubeRef.current, {
      videoId: 'AHYNxpqKqwo',
      playerVars: {
        enablejsapi: 1,
        origin: 'https://localhost:9002',
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

    console.log('Ran use-effect in youtube component.')
  }, [])

  return (
    <>
      <AspectRatio ratio={16 / 9} mx="auto">
        <div ref={youtubeRef} className={classes.player} />
      </AspectRatio>
      <ProgressBar player={player} duration={duration} timestamps={timestamps} append={append} />
    </>
  )
}

// https://youtu.be/AHYNxpqKqwo?t=288
// https://youtu.be/AHYNxpqKqwo?t=809
// https://youtu.be/AHYNxpqKqwo?t=1330
type ProgressBarArgs = {
  player: YouTubePlayer | undefined
  duration: number | undefined
  timestamps: number[]
  append: React.Dispatch<React.SetStateAction<number[]>>
}
function ProgressBar({ player, duration, timestamps, append }: ProgressBarArgs) {
  const { classes, cx } = useStyles()

  const segments = timestamps.map(v => {
    const percent = Math.floor((v / duration!) * 100)
    return (
      <Popover width={300} trapFocus position="bottom" withArrow shadow="md">
        <Popover.Target>
          <div
            onClick={() => {
              console.log(player)
              player!.seekTo(v, true)
              console.log(`clicked on ${v}`)
            }}
            className={classes.point}
            key={v}
            style={{ left: `${percent}%` }}></div>
        </Popover.Target>
        <Popover.Dropdown
          sx={theme => ({
            background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
          })}>
          <TextInput label="Name" placeholder="Name" size="xs" />
        </Popover.Dropdown>
      </Popover>
    )
  })

  return (
    <div
      onDoubleClick={() => {
        if (player) {
          player.getCurrentTime().then(v => {
            append(timestamps.concat(Math.floor(v)))
            console.log(`time: ${v}`)
          })
        }
      }}
      className={classes.bar}>
      {player && duration && segments}
    </div>
  )
}
