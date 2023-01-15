import { AspectRatio, createStyles, Popover, TextInput, Tooltip } from '@mantine/core'
import { getHotkeyHandler, useDisclosure } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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

  const youtubeRef = useRef<HTMLDivElement>(null)
  const { classes, cx } = useStyles()

  const videoId = extractYoutubeId(node.siblings.uri)

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
      <ProgressBar
        parentId={node.siblings.id}
        player={player}
        duration={duration}
        chapterNodes={node.siblings.children}
      />
    </>
  )
}

type Chapter = { id?: number; uri?: string; title?: string; millisec: number }
type ProgressBarArgs = {
  parentId: number
  player: YouTubePlayer | undefined
  duration: number | undefined
  chapterNodes: NodeWithSiblings['siblings']['children']
}

type ActionTypes =
  | { type: 'create'; chapter: Chapter }
  | { type: 'update'; chapters: Chapter[] }
  | { type: 'delete'; chapter: Chapter }
  | { type: 'replace'; chapters: Chapter[] }
function ProgressBar({ parentId, player, duration, chapterNodes }: ProgressBarArgs) {
  const { classes, cx } = useStyles()

  useEffect(() => {
    const chapters = chapterNodes.map(node => {
      const millisec = parseFloat(node.uri.match(/(\[)(.*)(\])$/)![2])
      return { id: node.id, uri: node.uri, title: node.title, millisec: millisec }
    })
    chapterDispatch({ type: 'replace', chapters })
  }, [parentId])

  const [chapters, chapterDispatch] = useReducer((chapters: Chapter[], action: ActionTypes) => {
    if (action.type == 'create') {
      return chapters.concat(action.chapter)
    }

    if (action.type == 'update') {
      action.chapters.forEach(incomingChapter => {
        const match = chapters.find(chapter => chapter.millisec == incomingChapter.millisec)
        match && Object.assign(match, incomingChapter)
      })

      return chapters
    }

    if (action.type == 'delete') {
      return chapters.filter(chapter => chapter.millisec != action.chapter.millisec)
    }

    if (action.type == 'replace') {
      return action.chapters
    }

    return chapters
  }, [])

  return (
    <div
      onDoubleClick={() => {
        if (player) {
          player.getCurrentTime().then(currentTime => {
            chapterDispatch({
              type: 'create',
              chapter: { millisec: Math.round(currentTime * 1000) / 1000 },
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
            parentId={parentId}
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
  parentId: number
  player: YouTubePlayer
  duration: number
  chapter: Chapter
  chapterDispatch: React.Dispatch<ActionTypes>
}

const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`

function YoutubeChapter({
  parentId,
  player,
  duration,
  chapter,
  chapterDispatch,
}: YoutubeChapterArgs) {
  const { classes, cx } = useStyles()

  const percent = Math.floor((chapter.millisec / duration) * 100)

  const [opened, setOpened] = useState(false)

  const [value, setValue] = useState('')

  const queryClient = useQueryClient()

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
    addYoutubeChapter.mutate({ nodeId: parentId, timestamp: chapter.millisec, title: value })

    // IF success, or IF failyre
    showNotification({ title: `Status: ${addYoutubeChapter.status}`, color: 'teal', message: value })
    setOpened(false)
    setValue('')
  }

  const target = (
    <div
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
