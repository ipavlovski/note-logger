export const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`
export const ORIGIN_URL = `https://localhost:${import.meta.env.VITE_PORT}`

export const getImageUrl = (src: string | null) => src && `${SERVER_URL}/images/${src}`

export const getCaptureUrl = (capture: string) => capture.endsWith('.mp4') ?
  `${SERVER_URL}/capture/${capture}`.replace('.mp4', '.gif') : `${SERVER_URL}/capture/${capture}`
