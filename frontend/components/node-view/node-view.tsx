import { AspectRatio, createStyles, Divider, Skeleton, Text, Image, Group } from '@mantine/core'
import { IconCirclePlus, IconRefresh } from '@tabler/icons'
import { showNotification } from '@mantine/notifications'

import { useHotkeys } from '@mantine/hooks'
import Leaf from 'components/node-view/leaf'
import { createNewLeaf, deleteLeafs, parseNode, togglePreviewSelect, uploadGallery, uploadPreview } from 'components/node-view/node-view-slice'
import { useAppDispatch, useAppSelector } from 'frontend/hooks'

import client from 'frontend/client'

const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`

const useStyles = createStyles((theme) => ({
  scrollable: {
    overflowX: 'hidden',
    overflowY: 'scroll',
    maxHeight: '50vh',
    userSelect: 'none',
    '&::-webkit-scrollbar': {
      width: 6,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: '#b8adad',
      borderRadius: 12,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#7a2a73',
      borderRadius: 12,
    },
  },
  header: {
    fontSize: 20,
    color: theme.white,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 8,
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
  selectedPreview: {
    border: `2px solid ${theme.colors.dark[1]}`
  }
}))

export default function NodeView() {
  const { nodeWithProps, latestLeafId } = useAppSelector((state) => state.nodeView)
  const { leafs: selectedLeafs, preview: selectedPreview } = useAppSelector(
    (store) => store.nodeView.selected
  )

  const dispatch = useAppDispatch()

  useHotkeys([
    [
      'delete',
      () => {
        console.log('Deleting leafs...')
        nodeWithProps && dispatch(deleteLeafs({ leafIds: selectedLeafs, nodeId: nodeWithProps.id }))
      },
    ],
    [
      'ctrl+v',
      async () => {
        if (selectedLeafs.length >= 1) {
          if (selectedLeafs.length > 1) {
            showNotification({
              title: 'Failed to insert image.',
              message: `Please select ONE leaf.`,
              color: 'red',
              autoClose: 1600,
            })
            return
          }
  
          dispatch(uploadGallery('gallery'))

          return
        }

        if (selectedPreview) {
          dispatch(uploadPreview(nodeWithProps!.id))


          return
        }


      },
    ],
  ])

  const { classes, cx } = useStyles()

  if (!nodeWithProps) return <h3>no item selected</h3>

  const leafs = nodeWithProps.leafs.map((leaf, ind) => {
    return <Leaf {...{ leaf: leaf, editing: leaf.id == latestLeafId }} key={ind} />
  })

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
  console.log(`${SERVER_URL}/${nodeWithProps.thumbnail}`)
  const preview = nodeWithProps.thumbnail ? (
    <Image radius={'md'} src={`${SERVER_URL}/${nodeWithProps.thumbnail.path}`} />
  ) : (
    <Skeleton animate={false} radius="lg" />
  )

  return (
    <div>
      <Text<'a'> href={nodeWithProps.uri} component="a" className={classes.header}>
        {nodeWithProps.title}
      </Text>

      <AspectRatio
        ratio={16 / 9}
        mx="auto"
        className={cx(selectedPreview && classes.selectedPreview)}
        onClick={(event) => {
          // when shift is pressed, toggle selection of the element
          event.shiftKey && dispatch(togglePreviewSelect())
          // this prevents residual selects when shift is pressed
          event.preventDefault()
        }}
      >
        {preview}
        <Group>
          <IconRefresh
            className={nodeWithProps.icon ? classes.hidden : classes.refresh}
            onClick={() => {
              dispatch(parseNode(nodeWithProps.id))
            }}
          />
        </Group>
      </AspectRatio>

      <Group align="center" my="sm">
        <Text>metadata goes here ...</Text>
      </Group>

      <div className={classes.scrollable}>
        {leafs}
        <Divider
          onDoubleClick={() => dispatch(createNewLeaf(nodeWithProps.id))}
          m="md"
          variant="dashed"
          labelPosition="center"
          style={{
            cursor: 'grab',
            userSelect: 'none',
          }}
          label={<IconCirclePlus size={'1.5rem'} />}
        />
      </div>
    </div>
  )
}
