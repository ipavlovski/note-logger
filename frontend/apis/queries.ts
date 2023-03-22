import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import superjson from 'superjson'
import { Node } from '@prisma/client'

import type { AppRouter } from 'frontend/../trpc'
import { SERVER_URL } from 'frontend/apis/utils'
import { useMillerStore } from 'frontend/apis/stores'


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

export const useCategoryChain = () => {
  const chainName = useMillerStore((store) => store.chainName)
  const { data: chain = [] } = trpc.getCategoryChain.useQuery(chainName)
  return chain
}


export const useQueriedNodes = (columnIndex: 1 | 2 | 3) => {
  const categoryChain= useCategoryChain()
  const categoryId = categoryChain[columnIndex]?.id

  const { firstId, secondId } = useMillerStore((store) => store.selection)
  const parentId = columnIndex == 3 ? secondId : columnIndex == 2 ? firstId : null

  const { data: nodes = [] } = trpc.getQueriedNodes.useQuery(
    { parentId, categoryId: categoryId!, columnIndex },
    { enabled: !! categoryId && (!! parentId || columnIndex == 1) },
  )

  return nodes
}


export const useQueryCache = () => {
  const queryClient = useQueryClient()

  const getNodes = (columnIndex: number) => {
    return queryClient.getQueryData<Node[]>(
      [['getQueriedNodes'], { type: 'query', input: { columnIndex }}]
    )
  }

  return { getNodes }
}
