'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const LINKS = {
  Product: ['Features', 'Maya AI', 'Analytics', 'Pricing', 'Changelog'],
  Company: ['About', 'Blog', 'Careers', 'Press', 'Contact'],
  Legal: ['Privacy', 'Terms', 'Security', 'Cookies'],
  Resources: ['Docs', 'API', 'Community', 'Status', 'Support'],
}

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
                <rect width="30" height="30" rx="8" fill="url(#footerGrad)" />
                <path d="M15 6L21 21H9L15 6Z" fill="white" fillOpacity="0.95" />
                <defs>
                  <linearGradient id="footerGrad" x1="0" y1="0" x2="30" y2="30">
                    <stop stopColor="#428475" />
                    <stop offset="1" stopColor="#1A312C" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-[16px] font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>Ascend</span>
            </div>
            <p className="text-[13px] leading-relaxed mb-5" style={{ color: 'var(--text-faint)' }}>
              The operating system for your best self. Built for high-performers.
            </p>
            <div className="flex gap-2.5">
              {[
                { d: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                { d: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z' },
                { d: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22' },
              ].map((ico, i) => (
                <motion.a key={i} href="#" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}
                  whileHover={{ borderColor: '#428475', color: '#428475' }} whileTap={{ scale: 0.93 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ico.d} /></svg>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--text)' }}>{section}</p>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link}>
                    <Link href="#" className="text-[13.5px] transition-colors" style={{ color: 'var(--text-faint)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
                    >{link}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-[12.5px]" style={{ color: 'var(--text-faint)' }}>
            © 2025 Ascend. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-faint)' }}>
            <div className="w-2 h-2 rounded-full bg-[#2D8C5A]" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  )
}
