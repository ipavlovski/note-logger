import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from 'components/app'

if (import.meta.hot) import.meta.hot.on('vite:beforeUpdate', () => console.clear())

// store.dispatch(fetchHistory({ isoDate: new Date().toISOString() }))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
