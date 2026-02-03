import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import App from './App'
import './i18n' // Initialize i18n before app
import './index.css'

// TON Connect manifest URL - must be publicly accessible
const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <TonConnectUIProvider manifestUrl={manifestUrl}>
            <App />
        </TonConnectUIProvider>
    </StrictMode>,
)
