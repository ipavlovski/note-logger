export const blobToBase64 = async (blob: Blob) => {
  return new Promise<string | null>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = (err) => {
      console.log(err)
      reject(null)
    }
    reader.readAsDataURL(blob)
  })
}


export default class ClipboardHandler {
  private contents: ClipboardItem | null = null

  private constructor() {}

  public static create = async () => {
    const instance = new ClipboardHandler()

    instance.contents = await this.getClipboardContents()
    return instance
  }

  private static async getClipboardContents() {
    const query = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName })
    if (query.state == 'granted' || query.state == 'prompt') {
      const items = await navigator.clipboard.read()
      return items[0]
    }
    return null
  }


  async getURL() {
    if (this.contents != null && this.contents.types.includes('text/plain')) {
      const blob = await this.contents.getType('text/plain')
      const text = await blob.text()

      const isURL = /^(http|https):\/\/[^ "]+$/.test(text)
      if (isURL) return text
    }
    return null
  }


  async getImage() {
    if (this.contents != null && this.contents.types.includes('image/png')) {
      const blob = await this.contents.getType('image/png')
      return await blobToBase64(blob)
    }
    return null
  }

  async getVideo() {
    if (this.contents != null && this.contents.types.includes('text/plain')) {
      const blob = await this.contents.getType('text/plain')
      const text = await blob.text()

      const ind = text.indexOf('\n')
      const firstLine = text.substring(0, ind)
      const restLines = text.substring(ind + 1)

      const isBase64 = /^data:.*:base64/.test(firstLine)
      if (isBase64) return `data:video/mp4;base64,${restLines}`
    }
    return null
  }
}