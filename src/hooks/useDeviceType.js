import { useState, useEffect } from 'react'

/**
 * Device type detection hook — listens to window resize events
 * and returns a reactive device classification.
 *
 * Breakpoints:
 * - Phone: < 768px
 * - Tablet: 768px - 1024px
 * - Desktop: > 1024px
 *
 * @returns {'phone' | 'tablet' | 'desktop'} Current device type (reactive)
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

/**
 * Pure function to classify viewport width into device category.
 * @param {number} width - Viewport width in pixels
 * @returns {'phone' | 'tablet' | 'desktop'} Device classification
 */
export function getDeviceType(width) {
    if (width < 768) return 'phone'
    if (width <= 1024) return 'tablet'
    return 'desktop'
}

export default useDeviceType
