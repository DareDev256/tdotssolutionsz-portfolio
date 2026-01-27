import React, { Suspense, lazy, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { useDeviceType } from './hooks/useDeviceType.js'
import './index.css'

const App = lazy(() => import('./App.jsx'))
const MobileApp = lazy(() => import('./MobileApp.jsx'))

function LoadingScreen() {
    return (
        <div className="loading-screen">
            <div className="loading-text">♬ LOADING PORTFOLIO ♬</div>
            <div className="loading-bar">
                <div className="loading-progress"></div>
            </div>
        </div>
    )
}

function ResponsiveApp() {
    const deviceType = useDeviceType()

    useEffect(() => {
        if (deviceType === 'phone') {
            document.body.classList.add('mobile-mode')
            document.body.classList.remove('desktop-mode')
        } else {
            document.body.classList.add('desktop-mode')
            document.body.classList.remove('mobile-mode')
        }
    }, [deviceType])

    return (
        <Suspense fallback={<LoadingScreen />}>
            {deviceType === 'phone'
                ? <MobileApp />
                : <App reducedEffects={deviceType === 'tablet'} />
            }
        </Suspense>
    )
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ResponsiveApp />
    </React.StrictMode>,
)
