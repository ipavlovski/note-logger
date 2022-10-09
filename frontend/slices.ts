import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import client from 'frontend/client'
import type { NodeWithProps } from 'backend/routes/node'

interface NodeList {
  selected: number[],
  active: number | null
}

const nodeListInit: NodeList = {
  selected: [],
  active: null
}

export const nodeListSlice = createSlice({
  name: 'nodeList',
  initialState: nodeListInit,
  reducers: {
    selectNode(state, action: PayloadAction<number>) {
      state.active = action.payload
    }
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


export const uploadPreview = createAsyncThunk('views/upload-preview', async (nodeId: number) => {
  // @ts-ignore
  const descriptor: PermissionDescriptor = { name: 'clipboard-read' }
  const result = await navigator.permissions.query(descriptor)

  if (result.state == 'granted' || result.state == 'prompt') {
    const allData = await navigator.clipboard.read()
    const data = allData[0]

    if (data.types.includes('image/png')) {
      const blob = await data.getType('image/png')
      const formData = new FormData()
      formData.append('image', blob, 'stuff')

      await client.upload(`/node/${nodeId}/preview`, formData)
    }
  }
})

// TODO: also uploadGalleryInline version from Monaco editor
// how to wait on the async thunk result?

export type DeleteLeafsRequest = { leafIds: number[] }
export type DeleteLeafsResponse = { deletedIds: number[] }
export const deleteLeafs = createAsyncThunk(
  'views/delete-leafs',
  async ({ leafIds, nodeId }: DeleteLeafsRequest & { nodeId: number }) => {
    return await client.delete<DeleteLeafsRequest, DeleteLeafsResponse>(`/node/${nodeId}/leafs`, {
      leafIds,
    })
  }
)

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
    }
  },
  // extraReducers: builder => {
  //   builder
  //     .addCase(deleteLeafs.fulfilled, (state, action) => {
  //       console.log(`len before delete: ${state.nodeWithProps!.leafs.length}`)
  //       const { deletedIds } = action.payload
  //       if (state.nodeWithProps != null) {
  //         state.nodeWithProps.leafs = state.nodeWithProps.leafs.filter(val => {
  //           if (deletedIds.includes(val.id)) console.log(`deleting ${val.id}`)
  //           return !deletedIds.includes(val.id)
  //         })
  //         state.selected = { ...emptySelection }
  //         console.log(`len after delete: ${state.nodeWithProps.leafs.length}`)
  //       }
  //       return state
  //     })
  //     .addCase(parseNode.fulfilled, (state, action) => {
  //       'error' in action.payload
  //         ? showNotification({ title: 'Error', message: action.payload.error, color: 'red' })
  //         : showNotification({ title: 'Success', message: action.payload.message, color: 'green' })
  //     })
  // },
})

export const {
  toggleLeafSelect,
  toggleGallerySelect,
  togglePreviewSelect,
  setLeafContent,
  startLeafEditing,
  stopLeafEditing,
  clearEditSelect
} = nodeViewSlice.actions

export const { selectNode } = nodeListSlice.actions
