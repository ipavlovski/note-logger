import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'

import client from 'frontend/client'

import type { LeafWithImages } from 'backend/routes/leaf'
import type { NodeWithProps } from 'backend/routes/node'
import { showNotification } from '@mantine/notifications'
import { RootState } from 'frontend/store'

interface NodeSelection {
  leafs: number[]
  gallery: number[]
  preview: boolean
  metadata: number[]
}

interface NodeView {
  status: 'idle' | 'loading'
  nodeWithProps: NodeWithProps | null
  selected: NodeSelection
  latestLeafId: number | null
}

const emptySelection: NodeSelection = {
  leafs: [],
  gallery: [],
  preview: false,
  metadata: [],
}

const initialState: NodeView = {
  status: 'idle',
  nodeWithProps: null,
  selected: { ...emptySelection },
  latestLeafId: null,
}

export const fetchNode = createAsyncThunk('views/fetch-node', async (nodeId: number) => {
  return await client.get<NodeWithProps | null>(`/node/${nodeId}`)
})

export const createNewLeaf = createAsyncThunk('views/insert-leaf', async (nodeId: number) => {
  return await client.put<null, { leaf: LeafWithImages }>(`/node/${nodeId}/leaf`, null)
})

export const parseNode = createAsyncThunk('views/parse-node', async (nodeId: number) => {
  return await client.safeGet<{ message: string }>(`/node/${nodeId}/parse`)
})

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

export const uploadGallery = createAsyncThunk(
  'views/upload-gallery',
  async (type: 'gallery' | 'inline', { getState }) => {
    const state = getState() as RootState
    const leafId = state.nodeView.selected.leafs[0]

    // @ts-ignore
    const descriptor: PermissionDescriptor = { name: 'clipboard-read' }
    const result = await navigator.permissions.query(descriptor)

    if (result.state == 'granted' || result.state == 'prompt') {
      const allData = await navigator.clipboard.read()
      const data = allData[0]

      if (data.types.includes('image/png')) {
        const blob = await data.getType('image/png')
        const formData = new FormData()
        formData.append('image', blob, 'gallery')

        await client.upload(`/leaf/${leafId}/upload`, formData)
      }
    }
  }
)

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

const nodeViewSlice = createSlice({
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
  },
  extraReducers: builder => {
    builder
      .addCase(fetchNode.pending, (state, action) => {
        state.status = 'loading'
      })
      .addCase(fetchNode.fulfilled, (state, action) => {
        state.nodeWithProps = action.payload
        state.selected = { ...emptySelection }
        state.latestLeafId = null
        state.status = 'idle'
      })
      .addCase(createNewLeaf.fulfilled, (state, action) => {
        if (state.nodeWithProps != null) {
          state.nodeWithProps.leafs = state.nodeWithProps.leafs.concat(action.payload.leaf)
          state.latestLeafId = action.payload.leaf.id
        }
      })
      .addCase(deleteLeafs.fulfilled, (state, action) => {
        console.log(`len before delete: ${state.nodeWithProps!.leafs.length}`)
        const { deletedIds } = action.payload
        if (state.nodeWithProps != null) {
          state.nodeWithProps.leafs = state.nodeWithProps.leafs.filter(val => {
            if (deletedIds.includes(val.id)) console.log(`deleting ${val.id}`)
            return !deletedIds.includes(val.id)
          })
          state.selected = { ...emptySelection }
          console.log(`len after delete: ${state.nodeWithProps.leafs.length}`)
        }
        return state
      })
      .addCase(parseNode.fulfilled, (state, action) => {
        'error' in action.payload
          ? showNotification({ title: 'Error', message: action.payload.error, color: 'red' })
          : showNotification({ title: 'Success', message: action.payload.message, color: 'green' })
      })
  },
})

export const { toggleLeafSelect, toggleGallerySelect, togglePreviewSelect, setLeafContent } =
  nodeViewSlice.actions

export default nodeViewSlice.reducer
