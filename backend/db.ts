import { HistoryAcc } from 'common/types'
import { DateTime } from 'luxon'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function queryHist(dateFrom: Date | string) {
  var histAcc: HistoryAcc[] = []

  // get the latest entry in history after given arg-date
  var latestEntry = await prisma.history.findFirst({
    orderBy: { visited_at: 'desc' },
    where: { visited_at: { lte: dateFrom } },
  })

  // query history for all elements after the given date
  var histResults = await prisma.history.findMany({
    take: 200,
    skip: 1, // Skip the cursor
    orderBy: { visited_at: 'desc' },
    cursor: { visited_at: latestEntry?.visited_at },
    include: { node: true },
  })

  // for each element in the history, prep accumulator
  histResults.forEach(histItem => {
    var dt = DateTime.fromJSDate(histItem.visited_at)

    // get the proper date, startin from 5am
    var dateStr =
      dt.hour >= 5
        ? dt.toFormat('yyyy-MM-dd cccc')
        : dt.minus({ day: 1 }).toFormat('yyyy-MM-dd cccc')

    // check for the matching date-acc in histAcc
    const accMatch = histAcc.find(acc => acc.title == dateStr)
    if (accMatch == null) {
      histAcc.push({ title: dateStr, children: [histItem] })
    } else {
      const matchInd = accMatch.children.findIndex(accItem => accItem.node_id == histItem.node_id)
      matchInd == -1
        ? accMatch.children.push(histItem)
        : Object.defineProperty(accMatch.children[matchInd], 'visited_at', histItem.visited_at)
    }
  })

  return histAcc
}
