import { v4 as uuidv4 } from 'uuid'
import { exec } from 'child_process'
import { createWriteStream } from 'fs'
import { stat } from 'fs/promises'
import fetch from 'node-fetch'
import { promisify } from 'util'


////////////// MANUAL CONVERTER

export const pexec = promisify(exec)

// stream URL file to disk
async function streamFile(url: string, path: string) {
  await fetch(url).then(res => res.body.pipe(createWriteStream(path)))
}

async function manualImageConverter(url: string, path: string) {
  // create temp file name
  var tempFile = `/tmp/note-logger/${uuidv4()}`

  // download the file
  // await pexec(`curl ${url} -s -o ${tempFile}`)
  await streamFile(url, tempFile)

  // identify its mime type
  var fileType = await pexec(`file ${tempFile} -i`).then(v => v.stdout)

  // if the file has a proper mime-type
  if (fileType.includes('image/vnd.microsoft.icon')) {
    await pexec(
      `convert ico:${tempFile} -thumbnail 256x256 -alpha on -background none -flatten ${path}`
    )
  } else {
    console.log('ERROR: no matching mime type for image conversion.')
  }

  // if success, should not throw an error
  await stat(path)
}
