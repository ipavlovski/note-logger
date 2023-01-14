import { AspectRatio, createStyles, Popover, TextInput } from '@mantine/core'
// import { extractYoutubeId } from 'backend/handlers'
import { NodeWithSiblings } from 'backend/routes'
import { useEffect, useRef, useState } from 'react'
import youTubePlayer from 'youtube-player'
import PlayerStates from 'youtube-player/dist/constants/PlayerStates'
import type { YouTubePlayer } from 'youtube-player/dist/types'

const useStyles = createStyles(theme => ({
  player: {
    padding: 0,
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
}))

function extractYoutubeId(url: string) {
  const matches = [...url.matchAll(/(.*)(www.youtube.com\/watch\?v=)(.{11})/g)]
  if (matches.length == 0) throw new Error('Incorrect youtube URL!')
  return matches[0][3]
}

// https://www.youtube.com/watch?v=AHYNxpqKqwo
// { videoNode }: { videoNode: VideoNode }
export function YouTube({ node }: { node: NodeWithSiblings }) {
  const [player, setPlayer] = useState<YouTubePlayer>()
  const [duration, setDuration] = useState<number>()
  const [timestamps, append] = useState<number[]>([])

  const youtubeRef = useRef<HTMLDivElement>(null)
  const { classes, cx } = useStyles()

  // const timestamps = useAppStore((state) => state.timestamps)
  // const append = useAppStore((state) => state.append)

  const videoId = extractYoutubeId(node.siblings.uri)
  // const children = node.siblings.children[0]

  useEffect(() => {
    const player = youTubePlayer(youtubeRef.current!, {
      videoId: videoId,
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

    console.log('Player is ready')

    return () => {
      console.log('Destroying player...')
      player.destroy()
    }
    
  }, [videoId])

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

type SegmentArg = {}
function Segment({}: SegmentArg) {}
