import { useState, useRef, useEffect } from 'react'
import PlayerStates from 'youtube-player/dist/constants/PlayerStates'
import youTubePlayer from 'youtube-player'
import type { YouTubePlayer, Options } from 'youtube-player/dist/types'
import { Segment, VideoNode } from 'common/types'

function YouTube({ videoNode }: { videoNode: VideoNode }) {
  const [player, setPlayer] = useState<YouTubePlayer>()

  const youtubeRef = useRef<any>(null)

  useEffect(() => {
    const player = youTubePlayer(youtubeRef.current, {
      videoId: videoNode.videoId,
      playerVars: {
        enablejsapi: 1,
        origin: 'https://localhost:9001',
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

const node = {
  videoTitle: 'adf',
  videoId: 'asdf',
  segments: [{ seconds: 123, title: 'adf'}]
}

function Preview() {
  return <>
    <YouTube videoNode={node} />
    <ProgressBar segments={[]} player={undefined} />
  </>
}

export default Preview