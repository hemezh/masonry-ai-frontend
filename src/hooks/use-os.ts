import { useState, useEffect } from 'react'

type OS = 'macos' | 'windows' | 'linux' | 'unknown'

export function useOS(): OS {
    const [os, setOS] = useState<OS>('unknown')

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase()

        if (userAgent.includes('mac')) {
            setOS('macos')
        } else if (userAgent.includes('win')) {
            setOS('windows')
        } else if (userAgent.includes('linux')) {
            setOS('linux')
        }
    }, [])

    return os
} 