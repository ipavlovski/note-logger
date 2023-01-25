import { createStyles, Text } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NodeWithSiblings } from 'backend/routes'
import { SERVER_URL } from 'components/app'

import Leafs, { useLeafStore } from 'components/leafs/leafs'
import Metadata from 'components/metadata'
import { getClipboardImage, useUploadGallery } from 'components/leafs/monaco'
import { useActiveNodeStore } from 'components/node-list'
import Preview from 'components/preview/preview'
import { fetchDeleteLeafs, fetchGetNodeWithSiblings, fetchPostUploadPreview } from 'frontend/api'
import { useEffect } from 'react'

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

const useDeleteLeafs = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (leafIds: number[]) => fetchDeleteLeafs(leafIds),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeNode'])
    },
  })
}

const useUploadPreview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ([nodeId, formData]: Parameters<typeof fetchPostUploadPreview>) =>
      fetchPostUploadPreview(nodeId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeNode'])
    },
  })
}

const useShortcutHandler = () => {
  const nodeId = useActiveNodeStore(state => state.activeNodeId)
  const selectedLeafs = useLeafStore(state => state.selection.leafs)
  const selectedPreview = useLeafStore(state => state.selection.preview)
  const { clearEditSelect, toggleGallerySelect, togglePreviewSelect } = useLeafStore(
    state => state.actions
  )

  const deleteLeafs = useDeleteLeafs()
  const uploadPreview = useUploadPreview()
  const uploadGallery = useUploadGallery()

  const handleLeafPaste = async () => {
    if (selectedLeafs.length == 1) {
      try {
        const formData = await getClipboardImage('gallery')
        await uploadGallery.mutateAsync([selectedLeafs[0], formData])
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
        await uploadPreview.mutateAsync([nodeId, formData])
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

const useNodeWithSiblings = () => {
  const activeNodeId = useActiveNodeStore(state => state.activeNodeId)
  return useQuery({
    queryKey: ['activeNode', activeNodeId],
    queryFn: () => fetchGetNodeWithSiblings(activeNodeId),
  })
}

export default function NodeView() {
  useShortcutHandler()

  const nodeQuery = useNodeWithSiblings()
  if (!nodeQuery.isSuccess) return <h3>Failed to fetch data</h3>

  return (
    <div>
      <Metadata node={nodeQuery.data} />
      <Preview node={nodeQuery.data} />
      <Leafs node={nodeQuery.data} />
    </div>
  )
}
