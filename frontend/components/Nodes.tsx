import { VideoNode } from 'common/types'

function Nodes({ videoNodes }: { videoNodes: VideoNode[] }) {
  return (
    <>
      {videoNodes.map(videoNode => {
        return (
          <ul className="video-node" key={videoNode.videoId}>
            {videoNode.videoTitle}
            {videoNode.segments.map(segment => {
              return (
                <li className="segment-node" key={segment.seconds}>
                  {segment.title}
                </li>
              )
            })}
          </ul>
        )
      })}
    </>
  )
}

export default Nodes