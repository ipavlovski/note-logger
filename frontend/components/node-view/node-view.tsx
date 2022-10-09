import { createStyles, Group, Text } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import Leafs from 'components/node-view/leafs'
import Metadata from 'components/node-view/metadata'
import Preview from 'components/node-view/preview'
import { nodeApi } from 'frontend/api'
import { useAppDispatch, useAppSelector } from 'frontend/store'
import { getClipboardImage } from 'frontend/util'

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

const useShortcutHandler = () => {
  const dispatch = useAppDispatch()
  const {
    leafs: selectedLeafs,
    preview: selectedPreview,
    gallery: selectedGallery,
    metadata: selectedMetadata,
  } = useAppSelector(store => store.nodeView.selected)

  const [uploadGallery] = nodeApi.useUploadGalleryMutation()

  ////////////// HANDLERS

  const handleLeafPaste = async () => {
    if (selectedLeafs.length == 1) {
      try {
        const formData = await getClipboardImage('gallery')
        await uploadGallery({ leafId: selectedLeafs[0], formData: formData })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        showNotification({
          title: 'ctrl+v',
          message: msg,
          color: 'yellow',
          autoClose: 1600,
        })
      }
    } else {
      showNotification({
        title: 'ctrl+v',
        message: `Please select ONE leaf only`,
        color: 'yellow',
        autoClose: 1600,
      })
    }
  }

  const handlePreviewPaste = () => {
    // dispatch(uploadPreview(nodeWithProps!.id))
  }

  const handleDefaultPaste = () => {
    showNotification({
      title: 'ctrl+v',
      message: `Nothing selected`,
      color: 'yellow',
      autoClose: 1600,
    })
  }

  const handleLeafDelete = () => {}

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
      () => {
        selectedLeafs.length >= 1
          ? handleLeafPaste()
          : selectedPreview != null
          ? handlePreviewPaste()
          : handleDefaultPaste()
      },
    ],
  ])
}

export default function NodeView() {
  const { active } = useAppSelector(state => state.nodeList)
  const { data: node } = nodeApi.useGetNodeByIdQuery(active!, { skip: active == null })
  const { classes } = useStyles()

  useShortcutHandler()

  if (!node) return <h3>no item selected</h3>

  return (
    <div>
      <Text<'a'> href={node.uri} component="a" className={classes.header}>
        {node.title}
      </Text>

      <Preview nodeId={node.id} preview={node.preview} />

      <Metadata />

      <Leafs nodeId={node.id} leafs={node.leafs} />
    </div>
  )
}
