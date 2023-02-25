import { createStyles } from '@mantine/core'
import { trpc, useActiveEntryStore } from 'components/app'
import Remark from 'components/remark'

const useStyles = createStyles((theme) => ({
  scrollable: {
    marginTop: 24,
    // overflowX: 'hidden',
    overflowY: 'scroll',
    maxHeight: '75vh',
    // userSelect: 'none',
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

export default function TreeView() {
  const { classes } = useStyles()

  const defaultQuery = 'all'
  const entries = trpc.getEntries.useQuery(defaultQuery)

  if (!entries.data) return <div>Loading...</div>

  return (
    <div className={classes.scrollable}>
      {entries.data.map((entry, ind) => <Remark markdown={entry.markdown} key={ind} />)}
      <LiveRender />
    </div>
  )
}