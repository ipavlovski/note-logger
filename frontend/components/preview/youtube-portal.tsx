import { AspectRatio, Portal } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import useMeasure from 'react-use-measure'
import YouTubePlayer from 'youtube-player'
import PlayerStates from 'youtube-player/dist/constants/PlayerStates'

import { ORIGIN_URL } from 'components/app'
import { useYoutubeStore } from 'components/preview/youtube'
import { useUpdateNodeMetadataMutation } from 'frontend/api'

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

  const getDuration = useCallback(async () => {
    return player.getDuration()
  }, [])

  return {
    seekTo,
    cueVideo,
    togglePlayPause,
    fastForward,
    rewind,
    getPosition,
    getStatus,
    getDuration,
  }
}

const useDurationSetter = () => {
  const { setDuration } = useYoutubeStore(state => state.actions)
  const updateMetadata = useUpdateNodeMetadataMutation()

  const durationSetter = ([videoUrl, videoDuration]: [videoUrl: string, videoDuration: number]) => {
    const videoId = new URL(videoUrl).searchParams.get('v')!
    const video = useYoutubeStore.getState().video
    const duration = useYoutubeStore.getState().duration

    if (duration != null) {
      console.log('Duration exists.')
      return
    }

    if (video == null) {
      console.log('Video is not set')
      return
    }

    if (videoId != video.videoId) {
      console.log('Video IDs do not match')
      return
    }

    // set the duration now
    setDuration(videoDuration)

    // save duration for later usage
    updateMetadata.mutate([video.nodeId, videoDuration])
  }

  return { durationSetter }
}

function Player() {
  const { durationSetter } = useDurationSetter()
  const { setPlayer } = useYoutubeStore(state => state.actions)
  const youtubeRef = useRef<HTMLDivElement>(null)

  const defaultVideoId = 'iOTAFRFgm8I'

  useEffect(() => {
    const player = YouTubePlayer(youtubeRef.current!, {
      videoId: defaultVideoId,
      playerVars: {
        enablejsapi: 1,
        origin: ORIGIN_URL,
        modestbranding: 1,
      },
    })

    player.on('ready', () => {
      setPlayer(player)
    })

    player.on('stateChange', async e => {
      const stateCode = await player.getPlayerState()
      const status = Object.entries(PlayerStates).find(v => v[1] == stateCode)![0]
      console.log(`youtube status: ${status}`)
      if (status == 'VIDEO_CUED') {
        const url = await player.getVideoUrl()
        const duration = await player.getDuration()
        const videoId = new URL(url).searchParams.get('v')!
        videoId != defaultVideoId && durationSetter([url, duration])
      }
    })
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
