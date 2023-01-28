import { AspectRatio, Portal } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import useMeasure from 'react-use-measure'
import YouTubePlayer from 'youtube-player'
import PlayerStates from 'youtube-player/dist/constants/PlayerStates'

import { ORIGIN_URL } from 'components/app'
import { useYoutubeStore } from 'components/preview/youtube'

export const useYoutubeShortcuts = () => {
  const controls = useYoutubeControls()

  useHotkeys([
    ['space', async () => controls?.togglePlayPause()],
    ['.', async () => controls?.fastForward()],
    [',', async () => controls?.rewind()],
  ])
}

export const useResizeYoutube = () => {
  const [ref, bounds] = useMeasure()

  const portalId = '#youtube-portal'
  const el = useMemo(() => document.querySelector<HTMLDivElement>(portalId), [portalId])

  const { top, left, width, height } = bounds
  el!.style.setProperty('top', `${top}px`)
  el!.style.setProperty('left', `${left}px`)
  el!.style.setProperty('width', `${width}px`)
  el!.style.setProperty('height', `${height}px`)

  return ref
}

// need to add 'active' flag -> usage with a shortcut
export const useYoutubeVisible = () => {
  const el = document.querySelector<HTMLDivElement>('#youtube-portal')!

  const openYoutube = useCallback(() => (el.style.display = 'block'), [])
  const closeYoutube = useCallback(() => (el.style.display = 'none'), [])

  return { openYoutube, closeYoutube }
}

export const useYoutubeControls = () => {
  const player = useYoutubeStore(state => state.player)

  if (player == null) {
    console.log('Youtube player unavailable')
    return null
  }

  const seekTo = useCallback(async (seconds: number) => {
    await player.seekTo(seconds, true)
  }, [])

  const cueVideo = useCallback(async (videoId: string, startSeconds?: number) => {
    await player.cueVideoById(videoId, startSeconds)
  }, [])

  const togglePlayPause = useCallback(async () => {
    const status = await getStatus()
    status == 'PLAYING' ? player.pauseVideo() : player.playVideo()
  }, [])

  const fastForward = useCallback(async () => {
    const position = await getPosition()
    await seekTo(position + 0.2)
  }, [])

  const rewind = useCallback(async () => {
    const position = await getPosition()
    await seekTo(position - 0.2)
  }, [])

  const getPosition = useCallback(async () => {
    return player.getCurrentTime().then(currentTime => Math.round(currentTime * 1000) / 1000)
  }, [])

  const getStatus = useCallback(async () => {
    const stateCode = await player.getPlayerState()
    return Object.entries(PlayerStates).find(v => v[1] == stateCode)![0]
  }, [])

  return {
    seekTo,
    cueVideo,
    togglePlayPause,
    fastForward,
    rewind,
    getPosition,
    getStatus,
  }
}

export const useSetYoutubeVideo = () => {}

// get the duration of the video from metadata
// if metadata doesnt have duration, acquire it from player
// can then 'save' it somehow
// for now return either NULL or NUMBER
export const useYoutubeDuration = () => {}


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

  return <div ref={youtubeRef} />
}

export default function YoutubePortal() {
  return (
    <main style={{ position: 'relative', zIndex: 1 }}>
      <Portal target="#youtube-portal">
        <AspectRatio ratio={16 / 9} mx="auto">
          <Player />
        </AspectRatio>
      </Portal>
    </main>
  )
}
