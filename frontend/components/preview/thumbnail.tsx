import { AspectRatio, createStyles, Image, Skeleton } from '@mantine/core'
import type { Preview as IPreview } from '@prisma/client'
import { NodeWithSiblings } from 'backend/routes'

import { SERVER_URL } from 'components/app'
import { useLeafStore } from 'components/leafs/leafs'

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

export default function Thumbnail({ preview }: { preview: IPreview | null }) {
  const { classes, cx } = useStyles()
  const togglePreviewSelect = useLeafStore(state => state.actions.togglePreviewSelect)
  const selectedPreview = useLeafStore(state => state.selection.preview)

  return (
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
  )
}
