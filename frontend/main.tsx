import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from 'components/app'

if (import.meta.hot) import.meta.hot.on('vite:beforeUpdate', () => console.clear())

createRoot(document.getElementById('root')!).render(<StrictMode children={<App />} />)
