import { Container, createStyles, Divider, Text } from '@mantine/core'
import { IconCirclePlus } from '@tabler/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MouseEvent } from 'react'
import { StateCreator } from 'zustand'

import type { LeafWithImages } from 'backend/routes'
import { AppState, SERVER_URL, useAppStore } from 'components/app'
import Gallery from 'components/gallery'
import Monaco from 'components/monaco'
import Remark from 'components/remark'






export interface LeafSlice {
  selection: {
    leafs: number[]
    gallery: number[]
    preview: boolean
    metadata: number[]
  }
  toggleLeafSelect: (leafId: number) => void
  editing: number[]
  startLeafEditing: (leafId: number) => void
  stopLeafEditing: (leafId: number) => void
  clearEditSelect: () => void
  toggleGallerySelect: (leafId: number) => void
  togglePreviewSelect: () => void
}


export const createLeafSlice: StateCreator<AppState, [], [], LeafSlice> = set => ({
  selection: {
    leafs: [],
    gallery: [],
    preview: false,
    metadata: [],
  },
  toggleLeafSelect: leafId =>
    set(state => ({
      selection: {
        ...state.selection,
        leafs: state.selection.leafs.includes(leafId)
          ? state.selection.leafs.filter(elt => elt != leafId)
          : state.selection.leafs.concat(leafId),
      },
    })),
  editing: [],
  startLeafEditing: leafId =>
    set(state => ({
      editing: state.editing.concat(leafId),
    })),
  stopLeafEditing: leafId =>
    set(state => ({
      editing: state.editing.filter(id => id != leafId),
    })),
  clearEditSelect: () =>
    set(state => ({
      editing: [],
      selection: { leafs: [], gallery: [], preview: false, metadata: [] },
    })),
  toggleGallerySelect: imageId =>
    set(state => ({
      selection: {
        leafs: [],
        preview: false,
        metadata: [],
        gallery: state.selection.gallery.includes(imageId)
          ? state.selection.gallery.filter(id => id != imageId)
          : state.selection.gallery.concat(imageId),
      },
    })),
  togglePreviewSelect: () =>
    set(state => ({
      selection: { leafs: [], gallery: [], preview: !state.selection.preview, metadata: [] },
    })),
})





const useStyles = createStyles(theme => ({
  outerLeaf: {
    padding: 8,
    borderTop: `2px solid ${theme.colors.dark[3]}`,
    marginRight: 16,
    '&:hover': {
      borderTop: `2px solid ${theme.colors.dark[1]}`,
    },
  },
  innerLeaf: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  selected: {
    paddingLeft: 16,
    paddingRight: 16,
    borderLeft: '2px solid #dfcc43',
    ':hover': {
      borderLeft: '2px solid #dfcc43',
    },
  },
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
    marginTop: 32,
  },
  divider: {
    cursor: 'grab',
    userSelect: 'none',
  },
}))

function Leaf({ leaf }: { leaf: LeafWithImages }) {
  const { classes, cx } = useStyles()

  const selectedLeafs = useAppStore(state => state.selection.leafs)
  const toggleLeafSelect = useAppStore(state => state.toggleLeafSelect)
  const startLeafEditing = useAppStore(state => state.startLeafEditing)
  const isEditing = useAppStore(state => state.editing.includes(leaf.id))

  return (
    <div
      onClick={event => {
        // when shift is pressed, toggle selection of the element
        event.shiftKey && toggleLeafSelect(leaf.id)
        // this prevents residual selects when shift is pressed
        event.preventDefault()
      }}>
      <Container className={classes.outerLeaf}>
        <Text align="end" size={'sm'}>
          {new Date(leaf.createdAt).toLocaleString()}
        </Text>

        <Gallery input={leaf.images} />

        <div
          className={cx(classes.innerLeaf, selectedLeafs.includes(leaf.id) && classes.selected)}
          onDoubleClick={(event: MouseEvent<HTMLDivElement>) => {
            // is bang-shift-key to prevent accidental editing during shift-selection op
            !event.shiftKey && startLeafEditing(leaf.id)
          }}>
          {isEditing ? (
            <Monaco leaf={leaf} markdown={leaf.content} />
          ) : (
            <Remark markdown={leaf.content == '' ? '...' : leaf.content} />
          )}
        </div>
      </Container>
    </div>
  )
}

export default function Leafs({ nodeId, leafs }: { nodeId: number; leafs: LeafWithImages[] }) {
  const { classes, cx } = useStyles()
  const queryClient = useQueryClient()

  const createNewLeaf = useMutation(
    (nodeId: number) => {
      return fetch(`${SERVER_URL}/node/${nodeId}/leaf`, { method: 'PUT' })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['activeNode'])
      },
    }
  )

  return (
    <div className={classes.scrollable}>
      {leafs.map((leaf, ind) => (
        <Leaf leaf={leaf} key={ind} />
      ))}

      <Divider
        onDoubleClick={() => {
          createNewLeaf.mutate(nodeId)
        }}
        m="md"
        variant="dashed"
        labelPosition="center"
        className={classes.divider}
        label={<IconCirclePlus size={'1.5rem'} />}
      />
    </div>
  )
}
