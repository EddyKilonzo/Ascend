'use client'

import Lenis from 'lenis'
import { useEffect, useRef } from 'react'

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.35,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.4,
      syncTouch: false,
    })

    lenisRef.current = lenis

    let rafId: number
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    // Expose globally so anchor links and Framer Motion scrollTo work
    ;(window as unknown as Record<string, unknown>).lenis = lenis

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return <>{children}</>
}
