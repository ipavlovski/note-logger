import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { NodeWithProps } from 'backend/routes/node'
import type { HistoryWithNode } from 'backend/routes/query'

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
      // providesTags: [{ type: 'Node', id: 'LIST' }],
    }),
  }),
})
