import { inferAsyncReturnType, initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import { z } from 'zod'
import superjson from 'superjson'

import * as h from 'backend/handlers'

// created for each request, return empty context
export const createContext = ({ req, res, }: trpcExpress.CreateExpressContextOptions) => ({})
type Context = inferAsyncReturnType<typeof createContext>;
const t = initTRPC.context<Context>().create({ transformer: superjson, })

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


  createCategoryColumn: t.procedure.input(
    z.object({
      name: z.string(),
      parentId: z.number()
    })
  ).mutation(async ({ input: { name, parentId } }) => {
    return await h.createCategoryColumn(name, parentId)
  }),


  getActiveNode: t.procedure.input(
    z.number()
  ).query(async ({ input: nodeId }) => {
    return await h.getActiveNode(nodeId)
  }),


  createEntry: t.procedure.input(
    z.object({ nodeId: z.number(), markdown: z.string().min(3) })
  ).mutation(async ({ input: { nodeId, markdown } }) => {
    return await h.createEntry(nodeId, markdown)
  }),


  updateEntry: t.procedure.input(
    z.object({ entryId: z.number(), markdown: z.string().min(3) })
  ).mutation(async ({ input: { entryId, markdown } }) => {
    return await h.updateEntry(entryId, markdown)
  }),

  createNewNode: t.procedure.input(
    z.object({
      parentId: z.number().nullable(),
      categoryId: z.number().nullable(),
      name: z.string(),
      url: z.string().nullable(),
      icon: z.string().nullable(),
      thumbnail: z.string().nullable(),
    })
  ).mutation(async ({ input }) => {
    return await h.createNewNode(input)
  }),

  captureMedia: t.procedure.input(
    z.string()
  ).mutation(async ({ input: base64 }) => {
    return await h.captureMedia(base64)
  }),


})
