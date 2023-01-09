import { AspectRatio, createStyles, Image, Skeleton } from '@mantine/core'
import type { Preview as IPreview } from '@prisma/client'

import { useAppStore } from 'components/app'

const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`

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

export default function Preview({ nodeId, preview }: { nodeId: number; preview: IPreview | null }) {
  const togglePreviewSelect = useAppStore(state => state.togglePreviewSelect)
  const selectedPreview = useAppStore(state => state.selection.preview)

  const { classes, cx } = useStyles()

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

{
  /* <iframe
          src="https://www.youtube.com/embed/Dorf8i6lCuk"
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
 */
}
