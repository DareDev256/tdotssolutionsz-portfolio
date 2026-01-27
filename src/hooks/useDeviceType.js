import { useState, useEffect } from 'react'

/**
 * Device type detection hook
 * Returns 'phone' | 'tablet' | 'desktop' based on viewport width
 * 
 * Breakpoints:
 * - Phone: < 768px
 * - Tablet: 768px - 1024px
 * - Desktop: > 1024px
 */
export function useDeviceType() {
    const [deviceType, setDeviceType] = useState(() => {
        if (typeof window === 'undefined') return 'desktop'
        return getDeviceType(window.innerWidth)
    })

    useEffect(() => {
        const handleResize = () => {
            setDeviceType(getDeviceType(window.innerWidth))
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return deviceType
}

function getDeviceType(width) {
    if (width < 768) return 'phone'
    if (width <= 1024) return 'tablet'
    return 'desktop'
}

export default useDeviceType
