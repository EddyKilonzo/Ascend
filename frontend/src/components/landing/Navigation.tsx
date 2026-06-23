'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import Image from 'next/image'

const NAV_LINKS = [
  { label: 'Features',  href: '#features' },
  { label: 'Maya AI',   href: '#maya' },
  { label: 'Showcase',  href: '#showcase' },
  { label: 'Pricing',   href: '#pricing' },
]

const EASE: [number,number,number,number] = [0.22, 1, 0.36, 1]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
        <Image src="/icons/asc.png" alt="Ascend" width={32} height={32} className="w-full h-full object-cover" />
      </div>
      <span
        className="text-[17px] font-bold tracking-[-0.03em]"
        style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
      >
        Ascend
      </span>
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" />
  const dark = theme === 'dark'

  return (
    <motion.button
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center"
      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {dark ? (
          <motion.svg key="sun" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
            <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </motion.svg>
        ) : (
          <motion.svg key="moon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Lock body scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          height: 64,
          background: scrolled
            ? 'color-mix(in srgb, var(--bg-card) 88%, transparent)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
          borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
          boxShadow: scrolled ? '0 1px 0 rgba(255,255,255,0.04)' : 'none',
        }}
      >
        <div className="h-full max-w-[1280px] mx-auto px-6 lg:px-10 flex items-center justify-between gap-8">
          <Link href="/" className="flex-shrink-0 focus-visible:outline-none">
            <Logo />
          </Link>

          {/* Desktop nav — pill indicator */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="group relative px-4 py-2 rounded-lg text-[13.5px] font-medium transition-colors duration-150 outline-none"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {label}
                <span
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ background: 'var(--bg-raised)' }}
                />
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
            <Link
              href="/login"
              className="px-4 py-2 text-[13.5px] font-medium rounded-lg transition-colors duration-150"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              Log in
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 px-5 py-[9px] rounded-xl text-[13.5px] font-semibold"
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #428475',
                  color: '#428475',
                  boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
                }}
              >
                Get Started
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="w-9 h-9 rounded-xl flex flex-col items-center justify-center gap-[5px]"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <motion.span className="block w-[18px] h-[1.5px] rounded-full origin-center" style={{ background: 'var(--text-muted)' }}
                animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 6.5 : 0 }} transition={{ duration: 0.22 }} />
              <motion.span className="block w-[18px] h-[1.5px] rounded-full" style={{ background: 'var(--text-muted)' }}
                animate={{ opacity: mobileOpen ? 0 : 1, scaleX: mobileOpen ? 0 : 1 }} transition={{ duration: 0.18 }} />
              <motion.span className="block w-[18px] h-[1.5px] rounded-full origin-center" style={{ background: 'var(--text-muted)' }}
                animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -6.5 : 0 }} transition={{ duration: 0.22 }} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu — full-screen overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden flex flex-col"
            style={{ background: 'var(--bg-card)', paddingTop: 64 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="flex flex-col px-6 pt-8 pb-10 gap-1"
            >
              {NAV_LINKS.map(({ label, href }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, ease: EASE }}
                >
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-4 text-[22px] font-semibold border-b"
                    style={{ color: 'var(--text)', borderColor: 'var(--border)', fontFamily: 'var(--font-syne)' }}
                  >
                    {label}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </Link>
                </motion.div>
              ))}

              <div className="flex flex-col gap-3 mt-8">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="w-full text-center py-3.5 rounded-xl text-[15px] font-semibold" style={{ background: 'var(--bg-card)', border: '1.5px solid var(--primary)', color: 'var(--primary)' }}>
                  Log in
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="w-full text-center py-3.5 rounded-xl text-[15px] font-semibold" style={{ background: '#FFFFFF', border: '1.5px solid #428475', color: '#428475', boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset' }}>
                  Get Started Free
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
