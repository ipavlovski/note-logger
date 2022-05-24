import { Router } from 'express'
import { z } from 'zod'
import { ErrorHandler } from 'backend/error-handler'

const nodeRoutes = Router()

const CreateNodeArgs = z.object({
  parent: z.number().optional(),
  title: z.string(),
  uri: z.string().optional(),
  icon: z.object({ iconId: z.number() }).optional(),
  image: z.string().optional(),
  category: z.string().array(),
  tags: z.string().array().optional(),
})
export type CreateNodeArgs = z.infer<typeof CreateNodeArgs>

// to create a node, need to go through a series of constraints
function createNode(reqBody: CreateNodeArgs) {
  return {}
}

nodeRoutes.put('/node', async (req, res) => {
  try {
    const body = CreateNodeArgs.parse(req.body)
    const results = createNode(body)
    res.json(results)
  } catch (error) {
    const err = ErrorHandler(error)
    res.json(err)
  }
})


nodeRoutes.post('/node', async (req, res) => {
  try {
    const body = CreateNodeArgs.parse(req.body)
    const results = createNode(body)
    res.json(results)
  } catch (error) {
    const err = ErrorHandler(error)
    res.json(err)
  }
})

nodeRoutes.delete('/node', async (req, res) => {
  try {
    const body = CreateNodeArgs.parse(req.body)
    const results = createNode(body)
    res.json(results)
  } catch (error) {
    const err = ErrorHandler(error)
    res.json(err)
  }
})


export default nodeRoutes
