import { AspectRatio, createStyles, Popover, TextInput, Tooltip } from '@mantine/core'
import { getHotkeyHandler, useDisclosure } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
// import { extractYoutubeId } from 'backend/handlers'
import { NodeWithSiblings } from 'backend/routes'
import { useEffect, useReducer, useRef, useState } from 'react'
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
  savedPoint: {
    backgroundColor: '#779ad1',
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
  // const [timestamps, append] = useState<number[]>([])

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
      <ProgressBar player={player} duration={duration} chapterNodes={node.siblings.children} />
    </>
  )
}

type Chapter = { id?: number; uri?: string; title?: string; millisec: number }
type ProgressBarArgs = {
  player: YouTubePlayer | undefined
  duration: number | undefined
  chapterNodes: NodeWithSiblings['siblings']['children']
}
function ProgressBar({ player, duration, chapterNodes }: ProgressBarArgs) {
  const { classes, cx } = useStyles()

  // str1.match(/\[.*\]$/g)
  // str1.replace(/\[.*\]$/, '')
  // url1.match(/(\[)(.*)(\])$/)

  const originalChapters = chapterNodes.map(node => {
    const millisec = parseFloat(node.uri.match(/(\[)(.*)(\])$/)![2])
    return { id: node.id, uri: node.uri, title: node.title, millisec: millisec }
  })
  // const [chapters, setChapters] = useState<Chapter[]>(originalChapters)

  const reducer = (chapters: Chapter[], incomingChapter: Chapter) => {
    const match = chapters.find(chapter => chapter.millisec == incomingChapter.millisec)
    if (match) {
      match.title = incomingChapter.title
      return chapters
    }
    return chapters.concat(incomingChapter)
  }
  const [chapters, chapterDispatch] = useReducer(reducer, originalChapters)

  return (
    <div
      onDoubleClick={() => {
        if (player) {
          player.getCurrentTime().then(currentTime => {
            chapterDispatch({
              millisec: Math.round(currentTime * 1000) / 1000,
            })
            console.log(`time: ${currentTime}`)
          })
        }
      }}
      className={classes.bar}>
      {player &&
        duration &&
        chapters.map(chapter => (
          <YoutubeChapter
            player={player}
            duration={duration}
            chapter={chapter}
            key={chapter.millisec}
            chapterDispatch={chapterDispatch}
          />
        ))}
    </div>
  )
}

type YoutubeChapterArgs = {
  player: YouTubePlayer
  duration: number
  chapter: Chapter
  chapterDispatch: React.Dispatch<Chapter>
  // chapterNode: NodeWithSiblings['siblings']['children'][0]
}
function YoutubeChapter({ player, duration, chapter, chapterDispatch }: YoutubeChapterArgs) {
  const { classes, cx } = useStyles()

  const percent = Math.floor((chapter.millisec / duration) * 100)

  const [opened, setOpened] = useState(false)

  const [value, setValue] = useState('')
  const handleSave = () => {
    showNotification({ title: 'Saved', color: 'teal', message: value })
    setOpened(false)
    chapterDispatch({ millisec: chapter.millisec, title: value })
    setValue('')

    // const targetChapter = chapter.find(v => v)
    // setChapters()
  }

  const target = (
    <div
      // on={() => setOpened(false)}
      onClick={() => {
        console.log(player)
        setOpened(o => !o)
        player!.seekTo(chapter.millisec, true)
        console.log(`clicked on ${chapter.millisec}`)
      }}
      className={cx(classes.point, chapter.title != null && classes.savedPoint)}
      style={{ left: `${percent}%` }}></div>
  )

  return chapter.title != null ? (
    <Tooltip label={chapter.title}>{target}</Tooltip>
  ) : (
    <Popover
      opened={opened}
      width={300}
      position="bottom"
      onChange={setOpened}
      withArrow
      shadow="md">
      <Popover.Target>{target}</Popover.Target>
      <Popover.Dropdown
        sx={theme => ({
          background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        })}>
        <TextInput
          placeholder="Title goes here."
          label="Press enter to submit..."
          value={value}
          onChange={event => setValue(event.target.value)}
          onKeyDown={getHotkeyHandler([['Enter', handleSave]])}
        />
      </Popover.Dropdown>
    </Popover>
  )
}
