import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TimelineNode } from 'backend/query'
import { NodeWithSiblings } from 'backend/routes'
import { SERVER_URL } from 'components/app'
import { useActiveNodeStore } from 'components/node-list'

////////////// GET /node/:id

const fetchGetNodeWithSiblings = async (id: number): Promise<NodeWithSiblings> => {
  const res = await fetch(`${SERVER_URL}/node/${id}`)
  return await res.json()
}

export const useNodeWithSiblingsQuery = () => {
  const activeNodeId = useActiveNodeStore(state => state.activeNodeId)
  return useQuery({
    queryKey: ['activeNode', activeNodeId],
    queryFn: () => fetchGetNodeWithSiblings(activeNodeId),
  })
}

////////////// PUT /node/:id/leaf

const fetchPostNewLeaf = async (nodeId: number) => {
  return fetch(`${SERVER_URL}/node/${nodeId}/leaf`, { method: 'PUT' })
}

export const useNewLeafMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (nodeId: number) => fetchPostNewLeaf(nodeId),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeNode'])
    },
  })
}

////////////// PUT /node/:id/metadata

const fetchUpdateMetadata = async (nodeId: number, duration: number) => {
  return fetch(`${SERVER_URL}/node/${nodeId}/metadata`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ duration }),
  })
}

export const useUpdateNodeMetadataMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ([nodeId, duration]: Parameters<typeof fetchUpdateMetadata>) =>
      fetchUpdateMetadata(nodeId, duration),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeNode'])
    },
  })
}

////////////// POST /leaf/:id/update

const fetchPutUpdateLeafContents = async (leafId: number, content: string) => {
  return fetch(`${SERVER_URL}/leaf/${leafId}/update`, {
    method: 'POST',
    body: JSON.stringify({ content }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const useUpdateLeafContentsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leafId, content }: { leafId: number; content: string }) =>
      fetchPutUpdateLeafContents(leafId, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeNode'])
    },
  })
}

////////////// DELETE /leafs

const fetchDeleteLeafs = async (leafIds: number[]) => {
  return fetch(`${SERVER_URL}/leafs`, {
    method: 'DELETE',
    body: JSON.stringify({ leafIds }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const useDeleteLeafsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (leafIds: number[]) => fetchDeleteLeafs(leafIds),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeNode'])
    },
  })
}

////////////// POST /leaf/:id/upload

const fetchPostUploadGallery = async (leafId: number, formData: FormData) => {
  return fetch(`${SERVER_URL}/leaf/${leafId}/upload`, {
    method: 'POST',
    body: formData,
  }).then(v => v.json())
}

export const useUploadGalleryMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ([leafId, formData]: Parameters<typeof fetchPostUploadGallery>) =>
      fetchPostUploadGallery(leafId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeNode'])
    },
  })
}

////////////// POST /node/:id/preview

const fetchPostUploadPreview = async (nodeId: number, formData: FormData) => {
  return fetch(`${SERVER_URL}/node/${nodeId}/preview`, {
    method: 'POST',
    body: formData,
  }).then(v => v.json())
}

export const useUploadPreviewMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ([nodeId, formData]: Parameters<typeof fetchPostUploadPreview>) =>
      fetchPostUploadPreview(nodeId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeNode'])
    },
  })
}

////////////// GET /timeline

const fetchGetTimelineNodes = async (): Promise<TimelineNode[]> => {
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

export const useTimelineNodesQuery = () => {
  // can put-in 'omnibar' query here:
  // const activeNodeId = useActiveNodeStore(state => state.activeNodeId)

  return useQuery({
    queryKey: ['nodeList'],
    queryFn: () => {
      console.log('REFETCHING TIMELINE')
      return fetchGetTimelineNodes()
    },
  })
}

////////////// POST /URI

const fetchPostSendUri = async (uri: string) => {
  return fetch(`${SERVER_URL}/uri`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uri }),
  })
}

export const useSubmitUriMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uri: string) => fetchPostSendUri(uri),
    onSuccess: () => {
      queryClient.invalidateQueries(['nodeList'])
    },
  })
}

////////////// POST /uri/:nodeId

const fetchPostUriWithChild = async (nodeId: number, timestamp: number, title: string) => {
  return fetch(`${SERVER_URL}/uri/${nodeId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp, title }),
  })
}

export const usePostUriWithChildMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ([nodeId, timestamp, title]: Parameters<typeof fetchPostUriWithChild>) =>
      fetchPostUriWithChild(nodeId, timestamp, title),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeNode'])
      queryClient.invalidateQueries(['nodeList'])
    },
  })
}

////////////// GET /paths/:type
type FileOrNote = 'file' | 'note'
const fetchGetFolderPaths = async (type: FileOrNote): 
  Promise<{ value: string; label: string; group: string }[]> => {
  return fetch(`${SERVER_URL}/paths/${type}`)
    .then(res => res.json())
    .then(res => res.map((v: any) => ({ ...v, label: v.value })))
}

export const useFolderPathsQuery = (type: FileOrNote) => {
  return useQuery({
    queryKey: ['suggestions', type],
    queryFn: async () => fetchGetFolderPaths(type),
  })
}

////////////// POST /paths/:type

const fetchPostCreateFolderPath = async (type: FileOrNote, query: string) => {
  return fetch(`${SERVER_URL}/paths/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type , uri: query }),
  })
}

export const useNewFolderPathsMutation = (type: FileOrNote) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (query: string) => fetchPostCreateFolderPath(type, query),
    onSuccess: () => queryClient.invalidateQueries(['suggestions', type]),
  })
}

////////////// POST /file

const fetchPostUploadFile = async (formData: FormData) => {
  return fetch(`${SERVER_URL}/file`, { method: 'POST', body: formData })
}

export const useUploadFileMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) => fetchPostUploadFile(formData),
    onSuccess: () => queryClient.invalidateQueries(['activeNode']),
  })
}


////////////// POST /file

const fetchPostCreateNote = async (title: string, path: string) => {
  return fetch(`${SERVER_URL}/note`, { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, path }),
  })
}

export const useCreateNoteMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ([title, path]: Parameters<typeof fetchPostCreateNote>) =>
      fetchPostCreateNote(title, path),
    onSuccess: () => queryClient.invalidateQueries(['activeNode']),
  })
}
