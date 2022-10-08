import { createStyles, Group, Text } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import Leafs from 'components/node-view/leafs'
import Metadata from 'components/node-view/metadata'
import { uploadGallery, uploadPreview } from 'components/node-view/node-view-slice'
import Preview from 'components/node-view/preview'
import { nodeApi } from 'frontend/api'
import { useAppDispatch, useAppSelector } from 'frontend/store'

const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`

const useStyles = createStyles(theme => ({
  scrollable: {
    overflowX: 'hidden',
    overflowY: 'scroll',
    maxHeight: '60vh',
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
}))

export default function NodeView() {
  const dispatch = useAppDispatch()
  const { leafs: selectedLeafs, preview: selectedPreview } = useAppSelector(
    store => store.nodeView.selected
  )
  const { active } = useAppSelector(state => state.nodeList)
  const { data: nodeWithProps } = nodeApi.useGetNodeByIdQuery(active!, { skip: active == null })
  const { classes, cx } = useStyles()

  useHotkeys([
    [
      'delete',
      () => {
        console.log('Deleting leafs...')
        // nodeWithProps && dispatch(deleteLeafs({ leafIds: selectedLeafs, nodeId: nodeWithProps.id }))
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


  if (!nodeWithProps) return <h3>no item selected</h3>

  return (
    <div>
      <Text<'a'> href={nodeWithProps.uri} component="a" className={classes.header}>
        {nodeWithProps.title}
      </Text>

      <Preview nodeId={nodeWithProps.id} preview={nodeWithProps.preview} />

      <Metadata />

      <Leafs nodeId={nodeWithProps.id} leafs={nodeWithProps.leafs} />
    </div>
  )
}
