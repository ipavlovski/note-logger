import { MantineProvider } from '@mantine/core'
import { NotificationsProvider } from '@mantine/notifications'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './main.scss'

import App from 'components/app'
import { fetchHistory } from 'components/node-list/node-list-slice'
import store from 'frontend/store'

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => console.clear())
}

store.dispatch(fetchHistory({ isoDate: new Date().toISOString() }))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <MantineProvider
          withGlobalStyles
          withNormalizeCSS
          theme={{
            colorScheme: 'dark',
          }}
        >
          <NotificationsProvider position="top-right">
            <Routes>
              <Route path="/" element={<App />}></Route>
            </Routes>
          </NotificationsProvider>
        </MantineProvider>
      </Provider>
    </BrowserRouter>
  </StrictMode>
)
