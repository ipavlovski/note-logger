import { createStyles, Text } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'

import Leafs from 'components/node-view/leafs'
import Metadata from 'components/node-view/metadata'
import Preview from 'components/node-view/preview'
import { nodeApi } from 'frontend/api'
import { clearEditSelect, toggleGallerySelect, togglePreviewSelect } from 'frontend/slices'
import { useAppDispatch, useAppSelector } from 'frontend/store'
import { getClipboardImage } from 'frontend/util'

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
  const {
    leafs: selectedLeafs,
    preview: selectedPreview,
    gallery: selectedGallery,
    metadata: selectedMetadata,
  } = useAppSelector(store => store.nodeView.selected)
  const { active: nodeId } = useAppSelector(state => state.nodeList)
  const dispatch = useAppDispatch()
  const [uploadGallery] = nodeApi.useUploadGalleryMutation()
  const [uploadPreview] = nodeApi.useUploadPreviewMutation()
  const [deleteLeafs] = nodeApi.useDeleteLeafsMutation()

  ////////////// HANDLERS

  const handleLeafPaste = async () => {
    if (selectedLeafs.length == 1) {
      try {
        const formData = await getClipboardImage('gallery')
        await uploadGallery({ leafId: selectedLeafs[0], formData: formData })
        dispatch(toggleGallerySelect(selectedLeafs[0]))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        showNotification({ title: 'ctrl+v', message: msg, color: 'red' })
      }
    } else {
      showNotification({ title: 'ctrl+v', message: `Select ONE leaf only`, color: 'yellow' })
    }
  }

  const handlePreviewPaste = async () => {
    try {
      const formData = await getClipboardImage('gallery')
      if (nodeId) {
        await uploadPreview({ nodeId: nodeId, formData: formData })
        dispatch(togglePreviewSelect())
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      showNotification({ title: 'ctrl+v', message: msg, color: 'red' })
    }
  }

  const handleDefaultPaste = () => {
    showNotification({ title: 'ctrl+v', message: `Nothing selected`, color: 'yellow' })
  }

  const handleLeafsDelete = () => {
    deleteLeafs({ leafIds: selectedLeafs })
    dispatch(clearEditSelect())
  }

  const handleDefaultDelete = () => {
    showNotification({ title: 'delete', message: `Nothing selected`, color: 'yellow' })
  }

  useHotkeys([
    [
      'delete',
      () => {
        selectedLeafs.length >= 1 ? handleLeafsDelete() : handleDefaultDelete()
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
