import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { NodeWithProps } from 'backend/routes/node'

interface NodeList {
  selected: number[]
  active: number | null
}

const nodeListInit: NodeList = {
  selected: [],
  active: null,
}

export const nodeListSlice = createSlice({
  name: 'nodeList',
  initialState: nodeListInit,
  reducers: {
    selectNode(state, action: PayloadAction<number>) {
      state.active = action.payload
    },
  },
})

interface NodeSelection {
  leafs: number[]
  gallery: number[]
  preview: boolean
  metadata: number[]
}

const emptySelection: NodeSelection = {
  leafs: [],
  gallery: [],
  preview: false,
  metadata: [],
}

interface NodeView {
  status: 'idle' | 'loading'
  nodeWithProps: NodeWithProps | null
  selected: NodeSelection
  editing: number[]
}

const initialState: NodeView = {
  status: 'idle',
  nodeWithProps: null,
  selected: { ...emptySelection },
  editing: [],
}

export const nodeViewSlice = createSlice({
  name: 'nodeView',
  initialState,
  reducers: {
    toggleLeafSelect(state, action: PayloadAction<number>) {
      // get current state
      const leafId = action.payload
      const current = [...state.selected.leafs]

      // nullify existing selection
      state.selected = { ...emptySelection }

      // set new selection
      state.selected.leafs = current.includes(leafId)
        ? current.filter(elt => elt != leafId)
        : current.concat(leafId)
    },

    toggleGallerySelect(state, action: PayloadAction<number>) {
      // get current state
      const imageId = action.payload
      const current = [...state.selected.gallery]

      // nullify existing selection
      state.selected = { ...emptySelection }

      // set new state
      state.selected.gallery = current.includes(imageId)
        ? current.filter(id => id != imageId)
        : current.concat(imageId)
    },

    togglePreviewSelect(state) {
      // get current state
      const current = state.selected.preview

      // nullify existing selection
      state.selected = { ...emptySelection }

      // set new state
      state.selected.preview = !current
    },

    toggleMetadataSelect(state, action: PayloadAction<number>) {},

    setLeafContent(state, action: PayloadAction<{ leafId: number; content: string }>) {
      const { leafId, content } = action.payload
      const leaf = state.nodeWithProps?.leafs.find(v => v.id == leafId)
      if (leaf) leaf.content = content
    },

    startLeafEditing(state, action: PayloadAction<number>) {
      const leafId = action.payload
      state.editing = state.editing.concat(leafId)
    },
    stopLeafEditing(state, action: PayloadAction<number>) {
      const leafId = action.payload
      state.editing = state.editing.filter(id => id != leafId)
    },
    clearEditSelect(state) {
      state.selected = { ...emptySelection }
      state.editing = []
    },
  },
})

export const {
  toggleLeafSelect,
  toggleGallerySelect,
  togglePreviewSelect,
  setLeafContent,
  startLeafEditing,
  stopLeafEditing,
  clearEditSelect,
} = nodeViewSlice.actions

export const { selectNode } = nodeListSlice.actions
