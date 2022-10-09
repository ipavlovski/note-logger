import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { NodeWithProps } from 'backend/routes/node'
import type { HistoryWithNode } from 'backend/routes/query'
import type { LeafWithImages } from 'backend/routes/leaf'

const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`

export const nodeApi = createApi({
  reducerPath: 'nodeApi',
  baseQuery: fetchBaseQuery({ baseUrl: SERVER_URL }),
  tagTypes: ['NodeList', 'Node'],
  endpoints: builder => ({
    getHistoryByDate: builder.query<HistoryWithNode[], string>({
      query: isoDate => `history/${isoDate}`,
      providesTags: [{ type: 'NodeList', id: 'LIST' }],
    }),
    getNodeById: builder.query<NodeWithProps, number>({
      query: nodeId => `node/${nodeId}`,
      providesTags: [{ type: 'Node', id: 'LIST' }],
    }),
    parseNodeById: builder.mutation<NodeWithProps, number>({
      query: nodeId => `node/${nodeId}/parse`,
      invalidatesTags: ['NodeList', 'Node'],
    }),
    createNewLeaf: builder.mutation<LeafWithImages, number>({
      query: nodeId => ({ url: `node/${nodeId}/leaf`, method: 'PUT' }),
      invalidatesTags: ['Node'],
    }),
    updateLeafContents: builder.mutation<LeafWithImages, { leafId: number; content: string }>({
      query: ({ leafId, content }) => ({
        url: `leaf/${leafId}/update`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['Node'],
    }),
    uploadGallery: builder.mutation<{ path: string }, { leafId: number; formData: FormData }>({
      query: ({ leafId, formData }) => ({
        url: `leaf/${leafId}/upload`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Node'],
    }),
  }),
})
