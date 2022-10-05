import { Box, Container, Grid } from '@mantine/core'

import NodeList from 'components/node-list/node-list'
import NodeView from 'components/node-view/node-view'

export default function App() {
  return (
    <Box mx={16} my={32}>
      <Grid gutter={'xl'}>
        <Grid.Col xs={5}>{<NodeList />}</Grid.Col>
        <Grid.Col xs={7}>{<NodeView />}</Grid.Col>
      </Grid>
    </Box>
  )
}
