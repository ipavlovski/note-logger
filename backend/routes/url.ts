import { Router } from 'express'
import { z } from 'zod'
import { ErrorHandler } from 'backend/error-handler'
import { youtubeChannelUrlHandler, youtubeVideoUrlHandler } from 'backend/urls/youtube'

const urlRoutes = Router()

const UrlBody = z.object({
  url: z.string().url(),
})
type UrlBody = z.infer<typeof UrlBody>

urlRoutes.post('/url', async (req, res) => {
  try {
    const body = UrlBody.parse(req.body)
    const url = new URL(body.url)

    const handlers = [youtubeChannelUrlHandler, youtubeVideoUrlHandler]
    for (const urlHandler of handlers) {
      if (urlHandler.matcher(url)) {
        const results = await urlHandler.handler(url)
        return res.json(results)
      }
    }

    throw new Error(`No matches for the URL: ${url.href}`)
  } catch (error) {
    const err = ErrorHandler(error)
    res.json(err)
  }
})
