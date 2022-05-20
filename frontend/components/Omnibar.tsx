import React, { ClipboardEvent, useState } from 'react'
import Select from 'react-select'

export default function Omnibar() {
  const dostuff = () => {
    console.log('uh oh!!!')
  }

  const [imgURL, setImgURL] = useState('https://picsum.photos/420/320')
  const [msg, setMsg] = useState('this is a message...')

  const handleClipboardEvent = (e: ClipboardEvent<HTMLInputElement>) => {
    // @ts-ignore
    const descriptor: PermissionDescriptor = { name: 'clipboard-read' }

    navigator.permissions.query(descriptor).then(result => {
      // If permission to read the clipboard is granted or if the user will
      // be prompted to allow it, we proceed.

      if (result.state == 'granted' || result.state == 'prompt') {
        navigator.clipboard.read().then(allData => {
          const data = allData[0]
          if (data.types.includes('text/plain')) {
            data.getType('text/plain').then(async blob => {
              const txt = await blob.text()

              const res = await fetch('https://homelab:3002/url', {
                method: 'POST',
                body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=m68FDmU0wGw' }),
                headers: { 'Content-Type': 'application/json' },
              })

              const results = await res.json()
              console.log(results)

              const url2 = `data:image/webp;base64,${results.icon.file}`

              setImgURL(url2)
              setMsg(results.title)
            })
          } else if (data.types.includes('image/png')) {
            data.getType('image/png').then(async blob => {
              const url = URL.createObjectURL(blob)

              const formData = new FormData()
              formData.append('some_text', 'tes')
              formData.append('avatar', blob, 'lolpath')

              const res = await fetch('https://homelab:3002/multi', {
                method: 'POST',
                body: formData,
              })

              const result = await res.json()

              const mimeType = 'image/png'
              const url2 = `data:${mimeType};base64,${result.tmp}`

              setImgURL(url2)
            })
          } else {
            console.log('Unknown buffer contents')
          }
        })
      }
    })
  }
  return (
    <div onPasteCapture={handleClipboardEvent}>
      <h2>Omnibar:</h2>
      <Select isClearable menuIsOpen={false} />
      <button onClick={dostuff}> click me</button>
      <p>{msg}</p>
      <img src={imgURL} />
    </div>
  )
}
