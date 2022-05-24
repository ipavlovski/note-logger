import { Router } from 'express'
import { z } from 'zod'
import { ErrorHandler } from 'backend/error-handler'

const leafRoutes = Router()

const LeafBody = z.object({
  url: z.string().url(),
})
type LeafBody = z.infer<typeof LeafBody>

function createLeaf(body: LeafBody) {
    return {}
}

leafRoutes.put('/leaf', async (req, res) => {
  try {
    const body = LeafBody.parse(req.body)
    const results = createLeaf(body)
    res.json(results)
  } catch (error) {
    const err = ErrorHandler(error)
    res.json(err)
  }
})

leafRoutes.post('/leaf', async (req, res) => {
  try {
    const body = LeafBody.parse(req.body)
    const results = createLeaf(body)
    res.json(results)
  } catch (error) {
    const err = ErrorHandler(error)
    res.json(err)
  }
})

leafRoutes.delete('/leaf', async (req, res) => {
  try {
    const body = LeafBody.parse(req.body)
    const results = createLeaf(body)
    res.json(results)
  } catch (error) {
    const err = ErrorHandler(error)
    res.json(err)
  }
})

export default leafRoutes
