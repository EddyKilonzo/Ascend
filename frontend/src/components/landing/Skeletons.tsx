'use client'

import { motion } from 'framer-motion'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function DashboardSkeleton() {
  return (
    <div className="w-full h-full p-5" style={{ background: 'var(--bg-card)' }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex-1">
          <motion.div className="h-3 w-20 mb-2 rounded-md" style={{ background: 'var(--bg-raised)' }}
            initial={{ opacity: 0.6 }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <motion.div className="h-4 w-32 rounded-md" style={{ background: 'var(--bg-raised)' }}
            initial={{ opacity: 0.6 }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
        </div>
        <div className="w-16 h-6 rounded-full" style={{ background: 'var(--bg-raised)' }} />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-xl p-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <motion.div className="h-3 w-8 mb-1.5 rounded" style={{ background: 'var(--bg-raised)' }}
              initial={{ opacity: 0.5 }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} />
            <motion.div className="h-5 w-10 rounded" style={{ background: 'var(--bg-raised)' }}
              initial={{ opacity: 0.5 }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 + 0.3 }} />
          </div>
        ))}
      </div>
      <div className="h-6 rounded-md mb-4" style={{ background: 'var(--bg-raised)', width: '60%' }} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="h-3 w-14 mb-2 rounded" style={{ background: 'var(--bg-raised)' }} />
          <div className="flex gap-[2.5px]">
            {Array.from({ length: 13 }).map((_, col) => (
              <div key={col} className="flex flex-col gap-[2.5px]">
                {Array.from({ length: 7 }).map((_, row) => (
                  <div key={row} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: 'var(--bg-raised)' }} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="h-3 w-16 mb-2 rounded" style={{ background: 'var(--bg-raised)' }} />
          <div className="h-14 rounded-md" style={{ background: 'var(--bg-raised)' }} />
        </div>
      </div>
    </div>
  )
}

export function MayaSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="w-10 h-10 rounded-full" style={{ background: 'var(--bg-raised)' }} />
        <div className="flex-1">
          <div className="h-4 w-12 mb-1.5 rounded" style={{ background: 'var(--bg-raised)' }} />
          <div className="h-3 w-20 rounded" style={{ background: 'var(--bg-raised)' }} />
        </div>
        <div className="w-12 h-5 rounded-full" style={{ background: 'var(--bg-raised)' }} />
      </div>
      <div className="flex-1 p-5 flex flex-col gap-3">
        <div className="max-w-[80%] h-10 rounded-2xl" style={{ background: 'var(--bg-raised)' }} />
        <div className="max-w-[60%] h-8 rounded-2xl self-end" style={{ background: 'var(--bg-secondary)' }} />
        <div className="max-w-[75%] h-9 rounded-2xl" style={{ background: 'var(--bg-raised)' }} />
      </div>
    </div>
  )
}

export function CardSkeleton({ height = '100%' }: { height?: string }) {
  return (
    <div className="w-full rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', height }}>
      <div className="px-5 py-4" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="h-3 w-24 rounded" style={{ background: 'var(--bg-raised)' }} />
      </div>
      <div className="p-5">
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full" style={{ background: 'var(--bg-raised)' }} />
              <div className="flex-1">
                <div className="h-3 w-32 mb-1.5 rounded" style={{ background: 'var(--bg-raised)' }} />
                <div className="h-2.5 w-20 rounded" style={{ background: 'var(--bg-raised)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}