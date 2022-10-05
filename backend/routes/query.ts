import { Prisma, PrismaClient } from '@prisma/client'
import { Router } from 'express'

const prisma = new PrismaClient()
const routes = Router()

const historyWithNode = Prisma.validator<Prisma.HistoryArgs>()({
  include: { node: { include: { icon: true } } },
})
export type HistoryWithNode = Prisma.HistoryGetPayload<typeof historyWithNode>

routes.get('/history/:date', async (req, res) => {
  const dateFrom = new Date(req.params.date)

  // get the latest
  var latestEntry = await prisma.history.findFirst({
    orderBy: { visited_at: 'desc' },
    where: { visited_at: { lte: dateFrom } },
  })

  // query history for all elements after the given date
  var historyResults = await prisma.history.findMany({
    take: 200,
    skip: 1, // Skip the cursor
    orderBy: { visited_at: 'desc' },
    cursor: { visited_at: latestEntry?.visited_at },
    include: { node: { include: { icon: true } } },
  })

  return res.json(historyResults)
})

export default routes
