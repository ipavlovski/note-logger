import { Router } from 'express'
import { z } from 'zod'
import { ErrorHandler } from 'backend/error-handler'

const categoryRoutes = Router()

const QueryBody = z.object({
  username: z.string(),
})
type QueryBody = z.infer<typeof QueryBody>

// get ALL the categories in the DB
categoryRoutes.get('/category', async (req, res) => {
  try {
    const query = QueryBody.parse(req.body)
    res.send('YES!')
  } catch (error) {
    console.log('select error')
  }
})

// create a new category
categoryRoutes.put('/category', async (req, res) => {
  try {
    const query = QueryBody.parse(req.body)
    res.send('YES!')
  } catch (error) {
    console.log('select error')
  }
})

// update a category
categoryRoutes.post('/category', async (req, res) => {
  try {
    const query = QueryBody.parse(req.body)
    res.send('YES!')
  } catch (error) {
    console.log('select error')
  }
})

// delete a category
categoryRoutes.delete('/category', async (req, res) => {
  try {
    const query = QueryBody.parse(req.body)
    res.send('YES!')
  } catch (error) {
    console.log('select error')
  }
})

export default categoryRoutes
