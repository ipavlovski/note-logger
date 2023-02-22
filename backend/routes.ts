import { inferAsyncReturnType, initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import { z } from 'zod'

import { getUserByName, addUser } from 'backend/handlers'

// created for each request, return empty context
export const createContext = ({ req, res, }: trpcExpress.CreateExpressContextOptions) => ({})
type Context = inferAsyncReturnType<typeof createContext>;
const t = initTRPC.context<Context>().create()

export const appRouter = t.router({
  getUser: t.procedure
    .input(z.string())
    .query(async (req) => {
      console.log(`query req.input: ${req.input}`)
      return await getUserByName(req.input)
    }),
  createUser: t.procedure
    .input(z.string().min(3))
    .mutation(async (req) => {
      console.log(`mutation req.input: ${req.input}`)
      return await addUser(req.input)
    })
})
