import { ErrorHandler } from 'backend/error-handler'
import { redditFilter } from 'backend/urls/reddit'
import { stackExchangeFilter } from 'backend/urls/stack-exchange'
import { Router } from 'express'
import { z } from 'zod'
import { URL } from 'url'
import FormData from 'form-data'
import { Blob } from 'node:buffer'

const routes = Router()

import multer from 'multer'
import { readFile, writeFile } from 'fs/promises'
// const mult = multer()
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

import { PrismaClient } from '@prisma/client'
import { DateTime } from 'luxon'
import { HistoryAcc } from 'common/types'

const prisma = new PrismaClient()

////////////// MULTIHANDLERS

routes.post('/multi', upload.single('avatar'), async (req, res) => {
  console.log('------')
  console.log(req.file)
  if (req.file) {
    await writeFile('image-1.png', req.file.buffer)
    console.log('written file image-1.png')
  }
  console.log(req.body)

  var form = new FormData()
  form.append('my_field', 'my value')
  form.append('my_other', 'other value')

  var image = await readFile('image-2.png')
  const tmp = image.toString('base64')
  // const tmp = new Blob(image., { type: 'image/png' });
  var prop = 'asdf'

  // res.setHeader('Content-Type', 'multipart/form-data').send(form)
  res.json({ tmp, prop })
})

routes.post('/multi2', async (req, res) => {
  console.log(req.body)
  res.json('lol')
})




async function queryHist(dateFrom: Date | string) {
  var histAcc: HistoryAcc[] = []

  // get the latest entry in history after given arg-date
  var latestEntry = await prisma.history.findFirst({ 
    orderBy: { visited_at: 'desc' }, 
    where: { visited_at: { lte: dateFrom
  }} })

  // query history for all elements after the given date
  var histResults = await prisma.history.findMany({
    take: 200,
    skip: 1, // Skip the cursor
    orderBy: { visited_at: 'desc' },
    cursor: { visited_at: latestEntry?.visited_at },
    include: { node: true }
  })

  // for each element in the history, prep accumulator
  histResults.forEach(histItem => {
    var dt = DateTime.fromJSDate(histItem.visited_at)

    // get the proper date, startin from 5am
    var dateStr = dt.hour >= 5 ? dt.toFormat('yyyy-MM-dd cccc') : 
      dt.minus({day: 1}).toFormat('yyyy-MM-dd cccc')

    // check for the matching date-acc in histAcc
    const accMatch = histAcc.find(acc => acc.title == dateStr)
    if (accMatch == null) {
      histAcc.push({title: dateStr, children: [ histItem]})
    } else {
      const matchInd = accMatch.children.findIndex(accItem => accItem.node_id == histItem.node_id)
      matchInd == -1 ? accMatch.children.push(histItem) : 
        Object.defineProperty(accMatch.children[matchInd], 'visited_at', histItem.visited_at)
    }
  })

  return histAcc
}



routes.get('/history/:date', async (req, res) => {
  var date = req.params.date
  if (date != null && DateTime.fromISO(date).isValid) {
    const masterAcc = await queryHist(date)
    return res.json(masterAcc)
  } else {
    return res.json('ERROR')
  }
})

routes.get('/node/:id', async (req, res) => {
  var id = parseInt(req.params.id)

  const node = await prisma.node.findFirst({ where: { id: id}, include: { 
    parent: true,
    children: true,
    leafs: true,
    history: true,
    icon: true,
    backsplash: true,
    metadata: true,
    tags: true
  }})

  return res.json(node)

})

routes.post('/leaf/:id', async (req, res) => {
  var leafId = parseInt(req.params.id)
  var content = req.body.content

  await prisma.leaf.update({ where: { id: leafId}, data: { content: content }})
  return res.sendStatus(200)
})

routes.put('/node/:id/leaf', async (req, res) => {
  var id = parseInt(req.params.id)

  await prisma.node.update({ where: { id: id}, data: { leafs: { create: {
    content: 'new.'
  }}}})

  return res.sendStatus(200)
})



export default routes
