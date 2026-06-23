'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

const EASE: [number,number,number,number] = [0.16, 1, 0.3, 1]

const VARIANTS = {
  up:    { hidden: { opacity: 0, y: 64,  filter: 'blur(10px)' }, visible: { opacity: 1, y: 0,  filter: 'blur(0px)' } },
  down:  { hidden: { opacity: 0, y: -40, filter: 'blur(8px)'  }, visible: { opacity: 1, y: 0,  filter: 'blur(0px)' } },
  left:  { hidden: { opacity: 0, x: 60,  filter: 'blur(8px)'  }, visible: { opacity: 1, x: 0,  filter: 'blur(0px)' } },
  right: { hidden: { opacity: 0, x: -60, filter: 'blur(8px)'  }, visible: { opacity: 1, x: 0,  filter: 'blur(0px)' } },
  scale: { hidden: { opacity: 0, scale: 0.88, filter: 'blur(6px)' }, visible: { opacity: 1, scale: 1, filter: 'blur(0px)' } },
  fade:  { hidden: { opacity: 0 },                                   visible: { opacity: 1 } },
} as const

export interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: keyof typeof VARIANTS
  duration?: number
  once?: boolean
  threshold?: number
}

export default function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
  duration = 0.75,
  once = true,
  threshold = 0.12,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inView = useInView(ref, { once, amount: threshold as any })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={VARIANTS[direction]}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/* Stagger container — animates children one after another */
export function ScrollRevealGroup({
  children,
  className,
  stagger = 0.1,
  delay = 0,
  direction = 'up',
  duration = 0.65,
  once = true,
}: Omit<ScrollRevealProps, 'threshold'> & { stagger?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inView = useInView(ref, { once, amount: 0.08 as any })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              variants={VARIANTS[direction]}
              transition={{ duration, ease: EASE }}
            >
              {child}
            </motion.div>
          ))
        : <motion.div variants={VARIANTS[direction]} transition={{ duration, ease: EASE }}>{children}</motion.div>}
    </motion.div>
  )
}
