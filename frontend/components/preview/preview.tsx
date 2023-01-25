import { NodeWithSiblings } from 'backend/routes'

import PDF from './pdf'
import Thumbnail from './thumbnail'
import YouTube from './youtube'

// export default function Preview({ nodeId, preview, uri, siblings }: PreviewArgs) {
export default function Preview({ node }: { node: NodeWithSiblings }) {
  return node.uri.startsWith('https://www.youtube.com/watch') ? (
    <YouTube node={node} />
  ) : node.uri.startsWith('file://') && node.uri.includes('.pdf') ? (
    <PDF node={node} />
  ) : (
    <Thumbnail preview={node.preview} />
  )
}
