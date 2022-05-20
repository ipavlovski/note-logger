import { createWriteStream } from 'fs'
import fetch from 'node-fetch'

async function streamFile(url: string, path: string) {
  await fetch(url).then(res => {
    const ws = createWriteStream(path)
    res.body.pipe(ws)
  })
}

