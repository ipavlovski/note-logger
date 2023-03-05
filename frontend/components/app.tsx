import { Box, Container, createStyles, Flex, Grid, MantineProvider, MantineThemeOverride } from '@mantine/core'
import { NotificationsProvider } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { create } from 'zustand'
import superjson from 'superjson'


import type { AppRouter } from 'frontend/../trpc'
import Omnibar from 'components/omnibar'
import Entries from 'components/entries'
import TOC from 'components/toc'
import Monaco from 'components/monaco'
import Remark from 'components/remark'
import Preview from 'components/preview'

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

    ':root': {
      // scrollbarGutter: 'stable',
    },
    // scrollbar-gutter: stable both-edges;

    // remark markdown-render creates issues without this
    '*, *::before, *::after': {
      padding: 0,
      margin: 0
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
  selectedChain: [0],
  selectedChild: 0,
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


const useStyles = createStyles((theme) => ({
  main: {
    height: '92vh',
    paddingRight: 40,
    overflowX: 'hidden',
    overflowY: 'scroll',
    '&::-webkit-scrollbar': {
      width: 10,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: theme.colors.dark[7],
      borderRadius: 12,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#405d53',
      borderRadius: 12,
    },
  },
  toc: {
    maxHeight: '92vh',
    transform: 'scaleX(-1)',
    minWidth: 300 ,
    overflowX: 'hidden',
    overflowY: 'scroll',
    '&::-webkit-scrollbar': {
      width: 10,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: theme.colors.dark[7],
      borderRadius: 12,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#405d53',
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
    <div>
      <Omnibar />
      <Grid m={0} p={0}>
        <Grid.Col span={4} p={0}>
          <Box className={classes.toc} >
            <div style={{ transform: 'scaleX(-1)', }}>
              <TOC />
            </div>
          </Box>
        </Grid.Col>
        <Grid.Col span={8} p={0}>
          <div style={{ height: '20vh' }}>
            <Entries className={classes.main} />
          </div>
        </Grid.Col>
      </Grid>
    </div>
  )
}


////////////// APP

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider withGlobalStyles withNormalizeCSS theme={globalTheme}>
          <NotificationsProvider position="top-right" autoClose={1600}>
            <Root />
          </NotificationsProvider>
        </MantineProvider>
      </QueryClientProvider>
    </trpc.Provider>

  )
}
