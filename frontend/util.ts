// blobTag - 'gallery', 'inline', ...
export async function getClipboardImage(blobTag: string) {
  // @ts-ignore
  const descriptor: PermissionDescriptor = { name: 'clipboard-read' }
  const result = await navigator.permissions.query(descriptor)

  if (result.state == 'granted' || result.state == 'prompt') {
    const allData = await navigator.clipboard.read()
    const data = allData[0]

    if (data.types.includes('image/png')) {
      const blob = await data.getType('image/png')
      const formData = new FormData()
      formData.append('image', blob, blobTag)

      return formData
    }
    throw new Error(`No handler for ${data} type`)
  }
  throw new Error('Failed to get clipboard permissions')
}
