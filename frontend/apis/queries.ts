import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import superjson from 'superjson'
import { Node } from '@prisma/client'

import type { AppRouter } from 'frontend/../trpc'
import { SERVER_URL } from 'frontend/apis/utils'
import { useMillerStore, useParentId } from 'frontend/apis/stores'


////////////// TRPC / RQ

export const trpc = createTRPCReact<AppRouter>()

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${SERVER_URL}/trpc`,
    }),
  ],
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})


////////////// QUERIES


export const useChainNames = () => {
  const { data: nodes = [] } = trpc.getChainNames.useQuery()
  return nodes
}

export const useCreateCategoryChain = () => {
  return trpc.createCategoryChain.useMutation()
}

export const useCreateCategoryColumn = () => {
  return trpc.createCategoryColumn.useMutation()
}

export const useCreateNewNode = () => {
  return trpc.createNewNode.useMutation()
}

export const useCategoryChain = () => {
  const chainName = useMillerStore((store) => store.chainName)
  const { data: chain = [] } = trpc.getCategoryChain.useQuery(chainName)
  return chain
}

export const useActiveNode = (nodeId: number | null) => {
  const { data: node } = trpc.getActiveNode.useQuery(nodeId!, { enabled: !!nodeId })
  return node
}


export const useCreateEntry = () => {
  const utils = trpc.useContext()
  return trpc.createEntry.useMutation({
    onSuccess: () => {
      utils.getActiveNode.invalidate()
    }
  })
}

export const useUpdateEntry = () => {
  const utils = trpc.useContext()
  return trpc.updateEntry.useMutation({
    onSuccess: () => {
      utils.getActiveNode.invalidate()
    }
  })
}


export const useCaptureMedia = () => {
  return trpc.captureMedia.useMutation()
}



export const useQueriedNodes = (columnIndex: 0 | 1 | 2) => {
  const categoryChain= useCategoryChain()
  const categoryId = categoryChain[columnIndex+1]?.id
  const parentId = useParentId(columnIndex)

  const { data: nodes = [] } = trpc.getQueriedNodes.useQuery(
    { parentId, categoryId: categoryId!, columnIndex },
    { enabled: !! categoryId && (!! parentId || columnIndex == 0) },
  )

  return nodes
}


export const useQueryCache = () => {
  const queryClient = useQueryClient()

  const getNodes = ({ categoryId, columnIndex, parentId }:
  {columnIndex?: number, categoryId?: number, parentId?: number| null}) => {
    return queryClient.getQueryData<Node[]>(
      [['getQueriedNodes'], { type: 'query', input: { columnIndex, categoryId, parentId } }]
    )
  }

  return { getNodes }
}
