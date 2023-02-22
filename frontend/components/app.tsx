import { Container, MantineProvider, MantineThemeOverride } from '@mantine/core'
import { NotificationsProvider } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'

import type { AppRouter } from 'frontend/../trpc'
import Omnibar from 'components/omnibar'
import TreeView from 'components/tree-view'
import { create } from 'zustand'
import Monaco from 'components/monaco'

export const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`
export const ORIGIN_URL = `https://localhost:${import.meta.env.VITE_PORT}`


////////////// STYLES

const globalTheme: MantineThemeOverride = {
  fontFamily: 'Hack',
  colorScheme: 'dark',
  colors: {
    'ocean-blue': ['#7AD1DD', '#5FCCDB', '#44CADC', '#2AC9DE', '#1AC2D9',
      '#11B7CD', '#09ADC3', '#0E99AC', '#128797', '#147885'],
    'cactus': ['#2BBC8A', '#405d53']
  },
  globalStyles: (theme) => ({
    '[data="cli-prompt"] > .linenumber': {
      display: 'none !important'
    },
    '[data="cli-output"] > .linenumber': {
      display: 'none !important'
    },
    '[data="hl-red"]': {
      backgroundColor: '#b0151528',
      display: 'block'
    },
    '[data="hl-green"]': {
      backgroundColor: '#0ddc4118',
      display: 'block'
    },

    '[data="cli-prompt"]': {
      borderLeft: '2px solid hsl(220, 3%, 60%)',
      padding: '2px 12px',
      marginLeft: 160,
      position: 'relative',
      '&::before': {
        position: 'absolute',
        content: 'attr(data-side-content)',
        opacity: 0.7,
        left: -172,
        width: 160,
        textAlign: 'right',
      }
    },
    '[data="cli-output"]': {
      borderLeft: '2px solid hsl(220, 3%, 60%)',
      padding: '2px 12px',
      marginLeft: 160,
      color: '#f2eaeac9',
      '& > *': {
        opacity: 0.9
      },
    },
  })
}

////////////// ZUSTAND

interface FilterStore {
  tags: string[]
  actions: {
    addTag: (tag: string) => void
    removeTag: (tag: string) => void
    setTags: (tags: string[]) => void
  }
}

export const useFilterStore = create<FilterStore>((set) => ({
  tags: [],
  actions: {
    setTags: (tags) => set(() => ({ tags })),
    addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),
    removeTag: (tag) => set((state) => ({ tags: state.tags.filter((t) => t != tag) })),
  },
}))

////////////// TRPC / RQ

export const trpc = createTRPCReact<AppRouter>()

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${SERVER_URL}/trpc`,
    }),
  ],
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

////////////// ROUTER

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: <TreeView />,
      },
    ],
  },
])


function Root() {
  return (
    <Container size='md' pt={30} sizes={{ xs: 540, sm: 720, md: 800, lg: 1140, xl: 2000 }}>
      <Omnibar />
      <Monaco />
      <Outlet />
    </Container>
  )
}


////////////// APP

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider withGlobalStyles withNormalizeCSS theme={globalTheme}>
          <NotificationsProvider position="top-right" autoClose={1600}>
            <RouterProvider router={router}/>
          </NotificationsProvider>
        </MantineProvider>
      </QueryClientProvider>
    </trpc.Provider>

  )
}
