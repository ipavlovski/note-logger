import { Grid } from '@mantine/core'

import MonacoEditor from 'components/preview/monaco'
import Remark from 'components/remark/remark'
import { useActiveNode } from 'frontend/apis/queries'
import { useMillerStore } from 'frontend/apis/stores'


export default function NodeRender() {
  const [firstId, secondId, thirdId] = useMillerStore((state) => state.selection)
  const nodeId = firstId && secondId && thirdId ? thirdId :
    firstId && secondId ? secondId : firstId ? firstId : null

  const node = useActiveNode(nodeId)
  
  return (

    <Grid>
      <Grid.Col span={12}>
        <MonacoEditor height={'20vh'}/>
        {node?.entries.map((entry) => <Remark key={entry.id} markdown={entry.markdown} />)}
      </Grid.Col>
    </Grid>
  )
}