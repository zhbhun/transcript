import { createRoot } from 'react-dom/client'
import { HeroUIProvider } from '@heroui/react'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <HeroUIProvider>
    <App />
  </HeroUIProvider>
)
