import { trpc } from 'components/app'
import Remark from 'components/remark'

export default function TreeView() {
  const defaultQuery = 'all'
  // const results = trpc.getUser.useQuery('all')
  const entries = trpc.getEntries.useQuery(defaultQuery)

  if (!entries.data) return <div>Loading...</div>

  return (
    <>
      {entries.data.map((entry) => <Remark markdown={entry.markdown} />)}
    </>
  )
}