import { Router } from 'express'
import { z } from 'zod'
import { ErrorHandler } from 'backend/error-handler'

const queryRoutes = Router()

const QueryBody = z.object({
  username: z.string(),
})
type QueryBody = z.infer<typeof QueryBody>

queryRoutes.get('/query', async (req, res) => {
  try {
    const query = QueryBody.parse(req.body)
    res.send('YES!')
  } catch (error) {
    console.log('select error')
  }
})

export default queryRoutes