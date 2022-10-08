import { AspectRatio, createStyles, Group, Image, Skeleton } from '@mantine/core'
import { IconRefresh } from '@tabler/icons'
import { parseNode, togglePreviewSelect } from 'components/node-view/node-view-slice'
import { useAppDispatch, useAppSelector } from 'frontend/store'

import type { NodeWithProps } from 'backend/routes/node'
import type { Preview as IPreview } from '@prisma/client'

const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`

const useStyles = createStyles(theme => ({
  selectedPreview: {
    border: `2px solid ${theme.colors.dark[1]}`,
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
  const { classes, cx } = useStyles()
  const selectedPreview = useAppSelector(store => store.nodeView.selected.preview)
  const dispatch = useAppDispatch()

  return (
    <AspectRatio
      ratio={16 / 9}
      mx="auto"
      className={cx(selectedPreview && classes.selectedPreview)}
      onClick={event => {
        // when shift is pressed, toggle selection of the element
        event.shiftKey && dispatch(togglePreviewSelect())
        // this prevents residual selects when shift is pressed
        event.preventDefault()
      }}>
      {preview ? (
        <Image radius={'md'} src={`${SERVER_URL}/${preview.path}`} />
      ) : (
        <Skeleton animate={false} radius="lg" />
      )}
      <Group>
        <IconRefresh
          className={preview ? classes.hidden : classes.refresh}
          onClick={() => {
            dispatch(parseNode(nodeId))
          }}
        />
      </Group>
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
// console.log(`${SERVER_URL}/${nodeWithProps.preview}`)
