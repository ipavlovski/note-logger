import { inferAsyncReturnType, initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import { z } from 'zod'
import superjson from 'superjson'

import * as h from 'backend/handlers'
import { queryEntries } from 'backend/query'

// created for each request, return empty context
export const createContext = ({ req, res, }: trpcExpress.CreateExpressContextOptions) => ({})
type Context = inferAsyncReturnType<typeof createContext>;
const t = initTRPC.context<Context>().create({
  transformer: superjson,
})


export const appRouter = t.router({
  getEntries: t.procedure.input(
    z.object({
      queryArgs: z.object({
        includeArchived: z.boolean(),
        tags: z.string().array()
      }),
      displayFlags: z.object({
        dates: z.enum(['none', 'day', 'week', 'month']),
        sort: z.object({
          categories: z.enum(['name-asc', 'name-desc', 'order']),
          entries: z.enum(['none', 'date', 'name', 'order'])
        }),
        shift: z.object({
          start: z.number(),
          end: z.number()
        }),
        virtual: z.discriminatedUnion('type', [
          z.object({ type: z.literal('tag'), tags: z.string().array() }),
          z.object({ type: z.literal('none') }),
        ]),
        useUpdated: z.boolean()
      })
    })
  ).query(async ({ input: { queryArgs, displayFlags } }) => {
    return await queryEntries(queryArgs, displayFlags)
  }),

  /**
   * @param tagQuery 'seeds' the query search
   */
  getTags: t.procedure.input(
    z.string()
  ).query(async ({ input: tagQuery }) => {
    return await h.getAllTags(tagQuery)
  }),

  /**
   * @param tagName is the name of tag to be created
   */
  createTag: t.procedure.input(
    z.string().min(3)
  ).mutation(async ({ input: tagName }) => {
    return await h.createNewTag(tagName)
  }),

  createOrUpdateEntry: t.procedure.input(
    z.object({ id: z.number().nullable(), markdown: z.string().min(3) })
  ).mutation(async (req) => {
    console.log(`createEntry mutation: ${req.input}`)
    return await h.createOrUpdateEntry(req.input)
  }),

  /**
   * @param annotations An object with `{tags, categories, title}`
   */
  updateEntryAnnotations: t.procedure.input(
    z.object({
      entryId: z.number(),
      tags: z.string().array().optional(),
      category: z.object({ id: z.number(), name: z.string() }).optional(),
      title: z.string().min(1).optional(),
    })
  ).mutation(async ({ input: { entryId: id, ...annotations } }) => {
    return await h.updateEntryAnnotations(id, annotations)
  }),

  uploadBase64File: t.procedure.input(
    z.object({
      base64: z.string()
    })
  ).mutation(async ({ input: { base64 } }) => {
    return await h.uploadBase64File({ base64 })
  })

})
