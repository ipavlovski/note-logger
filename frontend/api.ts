import { TimelineNode } from 'backend/query'
import { NodeWithSiblings } from 'backend/routes'
import { SERVER_URL } from 'components/app'

export const fetchGetNodeWithSiblings = async (id: number): Promise<NodeWithSiblings> => {
  const res = await fetch(`${SERVER_URL}/node/${id}`)
  return await res.json()
}

export const fetchPostNewLeaf = async (nodeId: number) => {
  return fetch(`${SERVER_URL}/node/${nodeId}/leaf`, { method: 'PUT' })
}

export const fetchPutUpdateLeafContents = async (leafId: number, content: string) => {
  return fetch(`${SERVER_URL}/leaf/${leafId}/update`, {
    method: 'POST',
    body: JSON.stringify({ content }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const fetchDeleteLeafs = async (leafIds: number[]) => {
  return fetch(`${SERVER_URL}/leafs`, {
    method: 'DELETE',
    body: JSON.stringify({ leafIds }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const fetchPostUploadGallery = async (leafId: number, formData: FormData) => {
  return fetch(`${SERVER_URL}/leaf/${leafId}/upload`, {
    method: 'POST',
    body: formData,
  }).then(v => v.json())
}

export const fetchPostUploadPreview = async (nodeId: number, formData: FormData) => {
  return fetch(`${SERVER_URL}/node/${nodeId}/preview`, {
    method: 'POST',
    body: formData,
  }).then(v => v.json())
}

export const fetchGetTimelineNodes = async (): Promise<TimelineNode[]> => {
  const props = {
    endDate: new Date(),
    range: 'week',
    split: 'day',
    virtualNodes: true,
    includeArchived: false,
  }

  return fetch(`${SERVER_URL}/timeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(props),
  }).then(res => res.json())
}

export const fetchPostSendUri = async (uri: string) => {
  return fetch(`${SERVER_URL}/uri`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uri }),
  })
}

export const fetchGetFilePaths = async (): Promise<
  { value: string; label: string; group: string }[]
> => {
  return fetch(`${SERVER_URL}/paths/file`)
    .then(res => res.json())
    .then(res => res.map((v: any) => ({ ...v, label: v.value })))
}

export const fetchPostCreateFilePath = async (query: string) => {
  return fetch(`${SERVER_URL}/paths/file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'file', uri: query }),
  })
}

export const fetchPostUploadFile = async (formData: FormData) => {
  return fetch(`${SERVER_URL}/file`, { method: 'POST', body: formData })
}
