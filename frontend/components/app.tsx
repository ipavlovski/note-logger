import { Container, createStyles, Flex, MantineProvider, MantineThemeOverride } from '@mantine/core'
import { NotificationsProvider } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { create } from 'zustand'
import superjson from 'superjson'


import type { AppRouter } from 'frontend/../trpc'
import Omnibar from 'components/omnibar'
import TreeView from 'components/tree-view'
import TOC from 'components/toc'
import Monaco from 'components/monaco'
import Remark from 'components/remark'

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

////////////// STORES

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


interface ActiveEntryStore {
  entryId: number | null
  markdown: string
  actions: {
    setMarkdown: (markdown: string) => void
    setEntry: (entryId: number | null, markdown: string) => void
    clearEntry: () => void
  }
}

const getLocalEntry = () => {
  const entry = localStorage.getItem('entry')
  return entry ?
    JSON.parse(entry) as { entryId: number | null, markdown: string} :
    { entryId: null, markdown: '' }
}

const setLocalEntry = (entryId: number | null, markdown: string) => {
  localStorage.setItem('entry', JSON.stringify({ entryId, markdown }))
  return { entryId, markdown }
}


export const useActiveEntryStore = create<ActiveEntryStore>((set) => ({
  entryId: getLocalEntry().entryId,
  markdown: getLocalEntry().markdown,
  actions: {
    setMarkdown: (markdown) => set((state) => setLocalEntry(state.entryId, markdown)),
    clearEntry: () => set(() => setLocalEntry(null, '')),
    setEntry: (entryId, markdown) => set(() => setLocalEntry(entryId, markdown))
  },
}))


interface ActiveStore {
  selectedChain: number[]
  selectedChild: number,
  setActive: (chain: number[], child: number) => void
}

export const useActiveStore = create<ActiveStore>((set) => ({
  selectedChain: [1, 2, 3],
  selectedChild: 1,
  setActive: (selectedChain, selectedChild) => set(() => ({ selectedChain, selectedChild }))
}))


////////////// TRPC / RQ

export const trpc = createTRPCReact<AppRouter>()

const trpcClient = trpc.createClient({
  transformer: superjson,
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
        element:

        <Flex>
          <TOC />
          <TreeView />
        </Flex>

        // <TreeView />,
      },
    ],
  },
])

const useStyles = createStyles(() => ({
  toc: {
    maxHeight: '90vh',

  },
  main: {
    maxHeight: '75vh',
  },
  scrollable: {
    marginTop: 12,
    overflowX: 'hidden',
    overflowY: 'scroll',
    '&::-webkit-scrollbar': {
      width: 6,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: '#b8adad',
      borderRadius: 12,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#7a2a73',
      borderRadius: 12,
    },
  },
}))


function LiveRender() {
  const markdown = useActiveEntryStore((state) => state.markdown)

  return <Remark markdown={markdown} />
}

function Root() {
  const { classes, cx } = useStyles()

  return (
    <Container size={'lg'} pt={30}>
      <Omnibar />

      <Flex>
        <div className={cx(classes.scrollable, classes.toc)}>
          <TOC />
        </div>
        <Container size={750}>
          <Monaco />
          <div className={cx(classes.scrollable, classes.main)}>
            <TreeView />
          </div>
          {/* <LiveRender /> */}
        </Container>
      </Flex>
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
            {/* <RouterProvider router={router}/> */}
            <Root />
          </NotificationsProvider>
        </MantineProvider>
      </QueryClientProvider>
    </trpc.Provider>

  )
}
