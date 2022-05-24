import { Router } from 'express'
import { z } from 'zod'
import { ErrorHandler } from 'backend/error-handler'

const tagRoutes = Router()

const QueryBody = z.object({
  username: z.string(),
})
type QueryBody = z.infer<typeof QueryBody>

// get ALL the categories in the DB
tagRoutes.get('/tag', async (req, res) => {
  try {
    const query = QueryBody.parse(req.body)
    res.send('YES!')
  } catch (error) {
    console.log('select error')
  }
})

// create a new category
tagRoutes.put('/tag', async (req, res) => {
  try {
    const query = QueryBody.parse(req.body)
    res.send('YES!')
  } catch (error) {
    console.log('select error')
  }
})

// update a category
tagRoutes.post('/tag', async (req, res) => {
  try {
    const query = QueryBody.parse(req.body)
    res.send('YES!')
  } catch (error) {
    console.log('select error')
  }
})

// delete a category
tagRoutes.delete('/tag', async (req, res) => {
  try {
    const query = QueryBody.parse(req.body)
    res.send('YES!')
  } catch (error) {
    console.log('select error')
  }
})

export default tagRoutes
