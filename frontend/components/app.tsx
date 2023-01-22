import { Box, Grid, MantineProvider } from '@mantine/core'
import { NotificationsProvider } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import create from 'zustand'

import NodeList from 'components/node-list'
import NodeView from 'components/node-view'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
})

interface AppState {
  active: number
  setActive: (id: number) => void
  selection: {
    leafs: number[]
    gallery: number[]
    preview: boolean
    metadata: number[]
  }
  toggleLeafSelect: (leafId: number) => void
  editing: number[]
  startLeafEditing: (leafId: number) => void
  stopLeafEditing: (leafId: number) => void
  clearEditSelect: () => void
  toggleGallerySelect: (leafId: number) => void
  togglePreviewSelect: () => void
}

export const useAppStore = create<AppState>()(set => ({
  active: 2,
  setActive: id => set(state => ({ active: id })),
  selection: {
    leafs: [],
    gallery: [],
    preview: false,
    metadata: [],
  },
  toggleLeafSelect: leafId =>
    set(state => ({
      selection: {
        ...state.selection,
        leafs: state.selection.leafs.includes(leafId)
          ? state.selection.leafs.filter(elt => elt != leafId)
          : state.selection.leafs.concat(leafId),
      },
    })),
  editing: [],
  startLeafEditing: leafId =>
    set(state => ({
      editing: state.editing.concat(leafId),
    })),
  stopLeafEditing: leafId =>
    set(state => ({
      editing: state.editing.filter(id => id != leafId),
    })),
  clearEditSelect: () =>
    set(state => ({
      editing: [],
      selection: { leafs: [], gallery: [], preview: false, metadata: [] },
    })),
  toggleGallerySelect: imageId =>
    set(state => ({
      selection: {
        leafs: [],
        preview: false,
        metadata: [],
        gallery: state.selection.gallery.includes(imageId)
          ? state.selection.gallery.filter(id => id != imageId)
          : state.selection.gallery.concat(imageId),
      },
    })),
  togglePreviewSelect: () =>
    set(state => ({
      selection: { leafs: [], gallery: [], preview: !state.selection.preview, metadata: [] },
    })),
}))

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme: 'dark',
          globalStyles: (theme) => ({
            '.PdfPage': {
              position: 'relative',
            },
  
            '.PdfPage__textLayer': {
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
              opacity: 0.2,
              lineHeight: 1,
            },
            '.PdfPage__textLayer > span': {
              color: 'transparent',
              position: 'absolute',
              whiteSpace: 'pre',
              cursor: 'text',
              transformOrigin: '0% 0%',
            },
          }),
        }}>
        <NotificationsProvider position="top-right" autoClose={1600}>
          <Box mx={16} my={32}>
            <Grid gutter={'xl'}>
              <Grid.Col xs={5}>{<NodeList />}</Grid.Col>
              <Grid.Col xs={7}>{<NodeView />}</Grid.Col>
            </Grid>
          </Box>
        </NotificationsProvider>
      </MantineProvider>
    </QueryClientProvider>
  )
}
