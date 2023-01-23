import { AspectRatio, createStyles, Image, Skeleton } from '@mantine/core'
import type { Preview as IPreview } from '@prisma/client'
import { NodeWithSiblings } from 'backend/routes'

import { SERVER_URL, useAppStore } from 'components/app'
import PDF from 'components/pdf'
import YouTube from 'components/youtube'


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
}))

function Thumbnail({ preview }: { preview: IPreview | null }) {
  return preview ? (
    <Image radius={'md'} src={`${SERVER_URL}/${preview.path}`} />
  ) : (
    <Skeleton animate={false} radius="lg" />
  )
}

// export default function Preview({ nodeId, preview, uri, siblings }: PreviewArgs) {
export default function Preview({ node }: { node: NodeWithSiblings }) {
  const { classes, cx } = useStyles()
  const togglePreviewSelect = useAppStore(state => state.togglePreviewSelect)
  const selectedPreview = useAppStore(state => state.selection.preview)

  return node.uri.startsWith('https://www.youtube.com/watch') ? (
    <YouTube node={node} />
  ) : node.uri.startsWith('file://') && node.uri.includes('.pdf') ? (
    <PDF node={node} />
  ) : (
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
      <Thumbnail preview={node.preview} />
    </AspectRatio>
  )
}
