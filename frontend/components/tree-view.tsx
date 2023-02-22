import { trpc } from 'components/app'

export default function TreeView() {
  const results = trpc.getUser.useQuery('test-1')
  if (!results.data) return <div>Loading...</div>
  return (
    <div>
      <p>{results.data.id} :: {results.data.name}</p>
    </div>
  )
}