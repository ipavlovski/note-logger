import { Box, CSSObject, Grid, MantineProvider, Portal } from '@mantine/core'
import { NotificationsProvider } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import NodeList from 'components/node-list'
import NodeView from 'components/node-view'
import YoutubePortal from 'components/preview/youtube-portal'

export const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`
export const ORIGIN_URL = `https://localhost:${import.meta.env.VITE_PORT}`

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

const globalStyles: CSSObject = {
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
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme: 'dark',
          globalStyles: () => globalStyles,
        }}>
        <NotificationsProvider position="top-right" autoClose={1600}>
          <Box mx={16} my={32}>
            <Grid gutter={'xl'}>
              <Grid.Col xs={5}>{<NodeList />}</Grid.Col>
              <Grid.Col xs={7}>{<NodeView />}</Grid.Col>
            </Grid>
          </Box>
          <YoutubePortal />
        </NotificationsProvider>
      </MantineProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
