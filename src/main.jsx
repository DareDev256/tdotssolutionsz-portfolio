import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import MobileApp from './MobileApp.jsx'
import { useDeviceType } from './hooks/useDeviceType.js'
import './index.css'

function ResponsiveApp() {
    const deviceType = useDeviceType()

    // Phone gets simplified grid view
    if (deviceType === 'phone') {
        return <MobileApp />
    }

    // Tablet gets 3D with reduced effects, Desktop gets full experience
    return <App reducedEffects={deviceType === 'tablet'} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ResponsiveApp />
    </React.StrictMode>,
)
