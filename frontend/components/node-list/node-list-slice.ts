import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'

import client from 'frontend/client'

import { HistoryWithNode } from 'backend/routes/query'

interface NodeList {
  status: 'idle' | 'loading'
  treeRoots: HistoryWithNode[]
}

const initialState: NodeList = {
  status: 'idle',
  treeRoots: [],
}

export const fetchHistory = createAsyncThunk(
  'nodes/fetch-history',
  async ({ isoDate }: { isoDate: string }) => {
    return await client.get<HistoryWithNode[]>(`/history/${isoDate}`)
  }
)

const nodeListSlice = createSlice({
  name: 'nodeList',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (state, action) => {
        state.status = 'loading'
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        // console.log(`Getting some data: action.payload.length`)
        state.treeRoots = state.treeRoots.concat(action.payload)
        state.status = 'idle'
      })
  },
})

export const {} = nodeListSlice.actions

export default nodeListSlice.reducer
