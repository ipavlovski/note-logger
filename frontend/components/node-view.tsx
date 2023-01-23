import { createStyles, Text } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {  NodeWithSiblings } from 'backend/routes'
import { SERVER_URL, useAppStore } from 'components/app'

import Leafs from 'components/leafs'
import Metadata from 'components/metadata'
import { getClipboardImage } from 'components/monaco'
import Preview from 'components/preview'


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
  const selectedLeafs = useAppStore(state => state.selection.leafs)
  const nodeId = useAppStore(state => state.active)
  const selectedPreview = useAppStore(state => state.selection.preview)
  const { clearEditSelect, toggleGallerySelect, togglePreviewSelect } = useAppStore(state => state)

  const queryClient = useQueryClient()

  const deleteLeafs = useMutation(
    (leafIds: number[]) => {
      return fetch(`${SERVER_URL}/leafs`, {
        method: 'DELETE',
        body: JSON.stringify({ leafIds }),
        headers: { 'Content-Type': 'application/json' },
      })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['activeNode'])
      },
    }
  )

  const uploadPreview = useMutation(
    ({ nodeId, formData }: { nodeId: number; formData: FormData }) => {
      return fetch(`${SERVER_URL}/node/${nodeId}/preview`, {
        method: 'POST',
        body: formData,
      })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['activeNode'])
      },
    }
  )

  const uploadGallery = useMutation(
    ({ leafId, formData }: { leafId: number; formData: FormData }) => {
      return fetch(`${SERVER_URL}/leaf/${leafId}/upload`, {
        method: 'POST',
        body: formData,
      })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['activeNode'])
      },
    }
  )

  //////////// HANDLERS

  const handleLeafPaste = async () => {
    if (selectedLeafs.length == 1) {
      try {
        const formData = await getClipboardImage('gallery')
        await uploadGallery.mutateAsync({ leafId: selectedLeafs[0], formData: formData })
        toggleGallerySelect(selectedLeafs[0])
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
        await uploadPreview.mutateAsync({ nodeId: nodeId, formData: formData })
        togglePreviewSelect()
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
    deleteLeafs.mutate(selectedLeafs)
    clearEditSelect()
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
  const { classes } = useStyles()
  useShortcutHandler()

  const active = useAppStore(state => state.active)
  const { data: node } = useQuery({
    queryKey: ['activeNode', active],
    queryFn: () =>
      fetch(`${SERVER_URL}/node/${active}`).then((res): Promise<NodeWithSiblings> => res.json()),
  })

  if (!node) return <h3>no item selected</h3>

  return (
    <div>
      <Text<'a'> href={node.uri} component="a" className={classes.header}>
        {node.title}
      </Text>

      {/* <Preview nodeId={node.id} preview={node.preview} uri={node.uri} /> */}
      <Preview node={node} />

      {/* <Metadata /> */}

      <Leafs nodeId={node.id} leafs={node.leafs} />
    </div>
  )
}
