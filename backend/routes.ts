import { inferAsyncReturnType, initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import { z } from 'zod'
import superjson from 'superjson'

import * as h from 'backend/handlers'

// created for each request, return empty context
export const createContext = ({ req, res, }: trpcExpress.CreateExpressContextOptions) => ({})
type Context = inferAsyncReturnType<typeof createContext>;
const t = initTRPC.context<Context>().create({
  transformer: superjson,
})


export const appRouter = t.router({
  getQueriedNodes: t.procedure.input(
    z.object({
      parentId: z.number().nullable(),
      categoryId: z.number(),
      columnIndex: z.number()
    })
  ).query(async ({ input: { parentId, categoryId } }) => {
    return await h.getQueriedNodes(parentId, categoryId)
  }),

  getChainNames: t.procedure.query(async () => {
    return await h.getChainNames()
  }),

  getCategoryChain: t.procedure.input(
    z.string()
  ).query(async ({ input: chainName }) => {
    return await h.getCategoryChain(chainName)
  }),

  createCategoryChain: t.procedure.input(
    z.string()
  ).mutation(async ({ input: chainName }) => {
    return await h.createCategoryChain(chainName)
  }),


})
