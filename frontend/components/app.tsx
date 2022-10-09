import { Provider } from 'react-redux'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MantineProvider, Box, Grid } from '@mantine/core'
import { NotificationsProvider } from '@mantine/notifications'

import NodeList from 'components/node-list/node-list'
import NodeView from 'components/node-view/node-view'
import store from 'frontend/store'

export default function App() {
  return (
    // <BrowserRouter>
    <Provider store={store}>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme: 'dark',
        }}>
        <NotificationsProvider position="top-right" autoClose={1600}>
          {/* <Routes> */}
          {/* <Route path="/"> */}
          <Box mx={16} my={32}>
            <Grid gutter={'xl'}>
              <Grid.Col xs={5}>{<NodeList />}</Grid.Col>
              <Grid.Col xs={7}>{<NodeView />}</Grid.Col>
            </Grid>
          </Box>
          {/* </Route> */}
          {/* </Routes> */}
        </NotificationsProvider>
      </MantineProvider>
    </Provider>
    // </BrowserRouter>
  )
}
