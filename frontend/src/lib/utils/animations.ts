/**
 * Ascend Motion Library — Framer Motion variants, springs, and easing.
 * Single source of truth for all animation across the app.
 */
import type { Variants } from 'framer-motion'

/* ═══════════════════════════════════
   SPRING PRESETS
   ═══════════════════════════════════ */
export const springs = {
  /** Soft settle, gentle overshoot — cards, hovers */
  gentle:  { type: 'spring', stiffness: 120, damping: 14 } as const,
  /** Responsive with slight bounce — buttons, toggles */
  bouncy:  { type: 'spring', stiffness: 300, damping: 22 } as const,
  /** Quick and tight — drawers, menus */
  snappy:  { type: 'spring', stiffness: 420, damping: 32 } as const,
  /** Slow drift — background elements, hero blobs */
  slow:    { type: 'spring', stiffness: 60,  damping: 12 } as const,
  /** Maximum overshoot — achievements, level-up reveals */
  elastic: { type: 'spring', stiffness: 500, damping: 22, mass: 0.8 } as const,
  /** Heavy and deliberate — page transitions */
  heavy:   { type: 'spring', stiffness: 160, damping: 24, mass: 1.2 } as const,
} as const

/* ═══════════════════════════════════
   EASING CURVES
   ═══════════════════════════════════ */
export const ease = {
  out:    [0.0, 0.0, 0.2, 1.0] as [number, number, number, number],
  in:     [0.4, 0.0, 1.0, 1.0] as [number, number, number, number],
  inOut:  [0.4, 0.0, 0.2, 1.0] as [number, number, number, number],
  smooth: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  back:   [0.34, 1.56, 0.64, 1.0] as [number, number, number, number],
  expo:   [0.16, 1.0,  0.3,  1.0] as [number, number, number, number],
}

/* ═══════════════════════════════════
   DURATION SCALE
   ═══════════════════════════════════ */
export const dur = {
  instant: 0.08,
  fast:    0.15,
  base:    0.25,
  slow:    0.4,
  xslow:   0.6,
  page:    0.5,
}

/* ═══════════════════════════════════
   FADE VARIANTS
   ═══════════════════════════════════ */
export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: dur.base, ease: ease.out } },
  exit:    { opacity: 0, transition: { duration: dur.fast, ease: ease.in } },
}

export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: dur.slow, ease: ease.expo } },
  exit:    { opacity: 0, y: -8, transition: { duration: dur.fast, ease: ease.in } },
}

export const fadeDown: Variants = {
  hidden:  { opacity: 0, y: -24 },
  visible: { opacity: 1, y: 0, transition: { duration: dur.slow, ease: ease.expo } },
  exit:    { opacity: 0, y: 8, transition: { duration: dur.fast, ease: ease.in } },
}

export const fadeLeft: Variants = {
  hidden:  { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: dur.slow, ease: ease.expo } },
  exit:    { opacity: 0, x: 8, transition: { duration: dur.fast, ease: ease.in } },
}

export const fadeRight: Variants = {
  hidden:  { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: dur.slow, ease: ease.expo } },
  exit:    { opacity: 0, x: -8, transition: { duration: dur.fast, ease: ease.in } },
}

/* ═══════════════════════════════════
   SCALE VARIANTS
   ═══════════════════════════════════ */
export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: dur.base, ease: ease.back } },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: dur.fast, ease: ease.in } },
}

export const scaleInBouncy: Variants = {
  hidden:  { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1, transition: springs.elastic },
  exit:    { opacity: 0, scale: 0.9, transition: { duration: dur.fast, ease: ease.in } },
}

/* ═══════════════════════════════════
   SLIDE VARIANTS (full-edge)
   ═══════════════════════════════════ */
export const slideFromBottom: Variants = {
  hidden:  { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0, transition: springs.snappy },
  exit:    { opacity: 0, y: '100%', transition: springs.snappy },
}

export const slideFromTop: Variants = {
  hidden:  { opacity: 0, y: '-100%' },
  visible: { opacity: 1, y: 0, transition: springs.snappy },
  exit:    { opacity: 0, y: '-100%', transition: springs.snappy },
}

export const slideFromLeft: Variants = {
  hidden:  { opacity: 0, x: '-100%' },
  visible: { opacity: 1, x: 0, transition: springs.snappy },
  exit:    { opacity: 0, x: '-100%', transition: springs.snappy },
}

export const slideFromRight: Variants = {
  hidden:  { opacity: 0, x: '100%' },
  visible: { opacity: 1, x: 0, transition: springs.snappy },
  exit:    { opacity: 0, x: '100%', transition: springs.snappy },
}

/* ═══════════════════════════════════
   STAGGER CONTAINERS
   ═══════════════════════════════════ */
export const stagger = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren, delayChildren } },
  exit:    { opacity: 0, transition: { staggerChildren: staggerChildren / 2 } },
})

export const staggerFast = stagger(0.04)
export const staggerBase = stagger(0.08)
export const staggerSlow = stagger(0.14)

/** Children used inside a stagger container */
export const staggerChild: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: dur.slow, ease: ease.expo } },
  exit:    { opacity: 0, y: -8, transition: { duration: dur.fast, ease: ease.in } },
}

export const staggerChildLeft: Variants = {
  hidden:  { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: dur.slow, ease: ease.expo } },
  exit:    { opacity: 0, x: -8, transition: { duration: dur.fast } },
}

/* ═══════════════════════════════════
   PAGE TRANSITIONS
   ═══════════════════════════════════ */
export const pageTransition: Variants = {
  hidden:  { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: dur.page, ease: ease.expo } },
  exit:    { opacity: 0, y: -8, filter: 'blur(2px)', transition: { duration: dur.base, ease: ease.in } },
}

/* ═══════════════════════════════════
   MODAL / DIALOG
   ═══════════════════════════════════ */
export const overlayVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: dur.base, ease: ease.out } },
  exit:    { opacity: 0, transition: { duration: dur.fast, ease: ease.in } },
}

export const dialogVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.94, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { ...springs.bouncy, restDelta: 0.001 } },
  exit:    { opacity: 0, scale: 0.96, y: 6, transition: { duration: dur.fast, ease: ease.in } },
}

/* ═══════════════════════════════════
   DRAWERS
   ═══════════════════════════════════ */
export const drawerRight: Variants = {
  hidden:  { opacity: 0.6, x: '100%' },
  visible: { opacity: 1, x: 0, transition: springs.snappy },
  exit:    { opacity: 0, x: '100%', transition: springs.snappy },
}

export const drawerLeft: Variants = {
  hidden:  { opacity: 0.6, x: '-100%' },
  visible: { opacity: 1, x: 0, transition: springs.snappy },
  exit:    { opacity: 0, x: '-100%', transition: springs.snappy },
}

export const drawerBottom: Variants = {
  hidden:  { opacity: 0.6, y: '100%' },
  visible: { opacity: 1, y: 0, transition: springs.snappy },
  exit:    { opacity: 0, y: '100%', transition: springs.snappy },
}

/* ═══════════════════════════════════
   DROPDOWN / MENU
   ═══════════════════════════════════ */
export const menuVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.96, y: -6 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: dur.fast, ease: ease.back } },
  exit:    { opacity: 0, scale: 0.96, y: -4, transition: { duration: dur.instant, ease: ease.in } },
}

export const menuVariantsUp: Variants = {
  hidden:  { opacity: 0, scale: 0.96, y: 6 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: dur.fast, ease: ease.back } },
  exit:    { opacity: 0, scale: 0.96, y: 4, transition: { duration: dur.instant, ease: ease.in } },
}

/* ═══════════════════════════════════
   TOOLTIP
   ═══════════════════════════════════ */
export const tooltipVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.88, y: 4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: dur.fast, ease: ease.back } },
  exit:    { opacity: 0, scale: 0.88, y: 4, transition: { duration: dur.instant } },
}

/* ═══════════════════════════════════
   COMMAND PALETTE
   ═══════════════════════════════════ */
export const commandPaletteVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.93, y: -20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { ...springs.bouncy, restDelta: 0.001 } },
  exit:    { opacity: 0, scale: 0.95, y: -10, transition: { duration: dur.base, ease: ease.in } },
}

/* ═══════════════════════════════════
   TOAST / NOTIFICATION
   ═══════════════════════════════════ */
export const toastVariants: Variants = {
  hidden:  { opacity: 0, x: 56, scale: 0.92 },
  visible: { opacity: 1, x: 0, scale: 1, transition: springs.bouncy },
  exit:    { opacity: 0, x: 56, scale: 0.92, transition: { duration: dur.fast, ease: ease.in } },
}

/* ═══════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════ */
export const sidebarVariants: Variants = {
  expanded:  { width: 256, transition: springs.snappy },
  collapsed: { width: 64,  transition: springs.snappy },
}

export const sidebarLabelVariants: Variants = {
  expanded:  { opacity: 1, x: 0, width: 'auto', transition: { delay: 0.06, duration: dur.fast, ease: ease.out } },
  collapsed: { opacity: 0, x: -8, width: 0, transition: { duration: dur.instant } },
}

/* ═══════════════════════════════════
   FLOATING DOCK (mobile)
   ═══════════════════════════════════ */
export const floatingDockVariants: Variants = {
  visible: { y: 0, opacity: 1, transition: springs.gentle },
  hidden:  { y: 100, opacity: 0, transition: springs.snappy },
}

export const dockItemVariants: Variants = {
  rest:  { scale: 1 },
  hover: { scale: 1.15, transition: springs.bouncy },
  tap:   { scale: 0.9 },
}

/* ═══════════════════════════════════
   NAV INDICATOR
   ═══════════════════════════════════ */
export const navIndicator: Variants = {
  inactive: { scaleY: 0, opacity: 0 },
  active:   { scaleY: 1, opacity: 1, transition: springs.bouncy },
}

/* ═══════════════════════════════════
   CARD INTERACTIONS
   ═══════════════════════════════════ */
export const cardVariants: Variants = {
  rest:  { y: 0 },
  hover: { y: -4, transition: springs.gentle },
  tap:   { y: 0, scale: 0.98, transition: { duration: dur.instant, ease: ease.out } },
}

export const cardGlow: Variants = {
  rest:  { boxShadow: 'var(--shadow-2)' },
  hover: { boxShadow: 'var(--shadow-4)', transition: { duration: dur.base, ease: ease.out } },
}

/* ═══════════════════════════════════
   BUTTON MICRO-INTERACTIONS
   ═══════════════════════════════════ */
export const buttonVariants = {
  tap:        { scale: 0.96, transition: { duration: dur.instant, ease: ease.out } },
  hover:      { scale: 1.02, transition: springs.bouncy },
  iconHover:  { scale: 1.1, rotate: 5, transition: springs.bouncy },
  iconTap:    { scale: 0.88 },
}

/* ═══════════════════════════════════
   MAYA ASSISTANT
   ═══════════════════════════════════ */
export const mayaOrbVariants: Variants = {
  idle: {
    scale: 1,
    opacity: 0.85,
    boxShadow: '0 0 0px rgba(66,132,117,0)',
  },
  listening: {
    scale: [1, 1.1, 1.06, 1.1, 1],
    opacity: 1,
    boxShadow: ['0 0 0px rgba(66,132,117,0)', '0 0 32px rgba(66,132,117,0.5)', '0 0 24px rgba(66,132,117,0.4)'],
    transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' },
  },
  processing: {
    rotate: [0, 360],
    opacity: [0.8, 1, 0.8],
    transition: { repeat: Infinity, duration: 1.2, ease: 'linear' },
  },
  speaking: {
    scale: [1, 1.06, 0.97, 1.04, 1],
    opacity: 1,
    transition: { repeat: Infinity, duration: 0.7, ease: 'easeInOut' },
  },
}

export const mayaDockVariants: Variants = {
  closed: { opacity: 0, scale: 0.88, y: 20, pointerEvents: 'none' },
  open:   { opacity: 1, scale: 1, y: 0, pointerEvents: 'auto', transition: springs.bouncy },
}

export const mayaChatBubble: Variants = {
  hidden:  { opacity: 0, scale: 0.88, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: springs.gentle },
}

/** Waveform bar — pass bar index for offset */
export const waveformBar = (index: number): Variants => ({
  animate: {
    scaleY: [0.3, 1, 0.4, 0.8, 0.3],
    transition: { repeat: Infinity, duration: 0.9, delay: index * 0.09, ease: 'easeInOut' },
  },
})

/** Typing indicator dot */
export const typingDot = (index: number): Variants => ({
  animate: {
    y: [0, -6, 0],
    opacity: [0.35, 1, 0.35],
    transition: { repeat: Infinity, duration: 1.2, delay: index * 0.15, ease: 'easeInOut' },
  },
})

/* ═══════════════════════════════════
   GAMIFICATION
   ═══════════════════════════════════ */

/** XP bar fill — pass target percentage 0-100 */
export const xpBarFill = (target: number) => ({
  initial: { width: '0%', opacity: 0.5 },
  animate: {
    width: `${target}%`,
    opacity: 1,
    transition: { duration: 1.2, ease: ease.expo, delay: 0.3 },
  },
})

export const achievementUnlock: Variants = {
  hidden:  { opacity: 0, scale: 0.4, rotate: -12 },
  visible: { opacity: 1, scale: 1, rotate: 0, transition: { ...springs.elastic, restDelta: 0.001 } },
  exit:    { opacity: 0, scale: 0.8, transition: { duration: dur.base } },
}

export const levelUpBadge: Variants = {
  hidden:  { opacity: 0, y: 48, scale: 0.5 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { ...springs.elastic, delay: 0.1 } },
  exit:    { opacity: 0, y: -24, scale: 0.85, transition: { duration: dur.slow, ease: ease.in } },
}

export const xpGainFloat: Variants = {
  initial: { opacity: 1, y: 0, scale: 1 },
  animate: { opacity: 0, y: -40, scale: 1.1, transition: { duration: dur.xslow, ease: ease.in } },
}

export const badgePing: Variants = {
  animate: {
    scale: [1, 1.5, 1],
    opacity: [0.8, 0, 0.8],
    transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
  },
}

/* ═══════════════════════════════════
   METRIC COUNTERS
   ═══════════════════════════════════ */
export const counterVariants: Variants = {
  hidden:  { opacity: 0, y: 12, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: dur.slow, ease: ease.expo } },
}

export const numberFlip: Variants = {
  initial: { y: 0, opacity: 1 },
  exit:    { y: -20, opacity: 0, transition: { duration: dur.fast, ease: ease.in } },
  enter:   { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: dur.base, ease: ease.out } },
}

/* ═══════════════════════════════════
   HEATMAP
   ═══════════════════════════════════ */
export const heatmapContainer = stagger(0.006)
export const heatmapCell: Variants = {
  hidden:  { opacity: 0, scale: 0.4 },
  visible: { opacity: 1, scale: 1, transition: { duration: dur.fast, ease: ease.back } },
}

/* ═══════════════════════════════════
   FOCUS MODE
   ═══════════════════════════════════ */
export const focusOverlay: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: ease.smooth } },
  exit:    { opacity: 0, transition: { duration: 0.4, ease: ease.in } },
}

export const timerRing = (progress: number) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: progress, opacity: 1, transition: { pathLength: { duration: 1, ease: ease.expo }, opacity: { duration: dur.base } } },
})

/* ═══════════════════════════════════
   CONFETTI PARTICLES
   ═══════════════════════════════════ */
export const confettiParticle = (seed: number): Variants => {
  const angle = seed * 137.508 * (Math.PI / 180)
  const radius = 60 + (seed % 5) * 30
  return {
    initial: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 },
    animate: {
      opacity: 0,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius - 80,
      scale: 0.3,
      rotate: seed % 2 === 0 ? 360 : -360,
      transition: { duration: 0.9 + (seed % 3) * 0.2, ease: ease.in, delay: (seed % 8) * 0.04 },
    },
  }
}

/* ═══════════════════════════════════
   ACCORDION / COLLAPSIBLE
   ═══════════════════════════════════ */
export const collapseVariants: Variants = {
  open: {
    height: 'auto',
    opacity: 1,
    transition: {
      height:  { ...springs.gentle, restDelta: 0.001 },
      opacity: { duration: dur.fast, ease: ease.out },
    },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: {
      height:  springs.gentle,
      opacity: { duration: dur.instant },
    },
  },
}

/* ═══════════════════════════════════
   OCR UPLOAD
   ═══════════════════════════════════ */
export const dropzoneVariants: Variants = {
  idle:    { scale: 1, borderColor: 'var(--border)' },
  hover:   { scale: 1.01, borderColor: 'var(--primary)', transition: springs.gentle },
  drag:    { scale: 1.02, borderColor: 'var(--primary)', boxShadow: '0 0 32px var(--primary-glow)', transition: springs.gentle },
  success: { scale: 1, borderColor: 'var(--success)', transition: springs.bouncy },
  error:   { scale: 1, borderColor: 'var(--danger)', transition: springs.snappy },
}

export const extractedItemVariants = stagger(0.06)
export const extractedItem: Variants = {
  hidden:  { opacity: 0, x: -12, scale: 0.96 },
  visible: { opacity: 1, x: 0, scale: 1, transition: springs.gentle },
  exit:    { opacity: 0, scale: 0.9, transition: { duration: dur.fast } },
}

/* ═══════════════════════════════════
   SECTION REVEALS (intersection)
   ═══════════════════════════════════ */
export const sectionReveal: Variants = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: dur.xslow, ease: ease.expo } },
}

export const sectionRevealLeft: Variants = {
  hidden:  { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: dur.xslow, ease: ease.expo } },
}
