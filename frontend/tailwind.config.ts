import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /* ─── Colors ─── */
      colors: {
        brand: {
          primary:    '#428475',
          secondary:  '#1A312C',
          light:      '#5ABFAD',
          dark:       '#091413',
          bg:         '#060C0B',
          surface:    '#0D1E1B',
          raised:     '#0F2622',
          foreground: '#EEF6F4',
          muted:      '#5A8A80',
          border:     '#1E3530',
        },
        status: {
          success: '#4CAF50',
          warning: '#F59E0B',
          danger:  '#EF4444',
          info:    '#3B82F6',
        },
        xp: {
          gold:   '#FFD700',
          silver: '#C0C0C0',
          bronze: '#CD7F32',
        },
      },

      /* ─── Fonts ─── */
      fontFamily: {
        sans:    ['var(--font-geist-sans)', 'Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-syne)', 'Syne', 'system-ui', 'sans-serif'],
        accent:  ['var(--font-amagro)', 'Amatic SC', 'cursive'],
      },

      /* ─── Type scale ─── */
      fontSize: {
        '2xs': ['0.625rem',  { lineHeight: '1rem',    letterSpacing: '0.02em' }],
        xs:    ['0.75rem',   { lineHeight: '1.125rem' }],
        sm:    ['0.8125rem', { lineHeight: '1.25rem'  }],
        base:  ['0.9375rem', { lineHeight: '1.5rem'   }],
        lg:    ['1.0625rem', { lineHeight: '1.625rem' }],
        xl:    ['1.1875rem', { lineHeight: '1.75rem'  }],
        '2xl': ['1.375rem',  { lineHeight: '1.875rem' }],
        '3xl': ['1.625rem',  { lineHeight: '2rem',     letterSpacing: '-0.015em' }],
        '4xl': ['2rem',      { lineHeight: '2.375rem', letterSpacing: '-0.025em' }],
        '5xl': ['2.5rem',    { lineHeight: '2.875rem', letterSpacing: '-0.03em'  }],
        '6xl': ['3rem',      { lineHeight: '3.375rem', letterSpacing: '-0.035em' }],
        '7xl': ['3.75rem',   { lineHeight: '4.125rem', letterSpacing: '-0.04em'  }],
        '8xl': ['4.5rem',    { lineHeight: '4.875rem', letterSpacing: '-0.045em' }],
        '9xl': ['6rem',      { lineHeight: '6.375rem', letterSpacing: '-0.05em'  }],
      },

      lineHeight: {
        tighter: '1.05',
        tight:   '1.1',
        snug:    '1.25',
        normal:  '1.5',
        relaxed: '1.65',
        loose:   '1.8',
      },

      letterSpacing: {
        tightest: '-0.05em',
        tighter:  '-0.025em',
        tight:    '-0.015em',
        normal:   '0em',
        wide:     '0.01em',
        wider:    '0.025em',
        widest:   '0.1em',
        caps:     '0.08em',
      },

      /* ─── Border radius ─── */
      borderRadius: {
        none:    '0px',
        sm:      'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md:      'var(--radius)',
        lg:      'var(--radius-lg)',
        xl:      'var(--radius-xl)',
        '2xl':   'var(--radius-2xl)',
        '3xl':   '1.5rem',
        full:    'var(--radius-full)',
      },

      /* ─── Shadows — elevation system ─── */
      boxShadow: {
        '0':  'none',
        '1':  'var(--shadow-1)',
        '2':  'var(--shadow-2)',
        '3':  'var(--shadow-3)',
        '4':  'var(--shadow-4)',
        '5':  'var(--shadow-5)',
        'primary':  'var(--shadow-primary)',
        'glow':     'var(--shadow-glow)',
        'glow-sm':  '0 0 12px rgba(66,132,117,0.18)',
        'glow-lg':  '0 0 60px rgba(66,132,117,0.3)',
        'glow-gold':'0 0 24px rgba(255,215,0,0.25)',
        'inner':    'var(--shadow-inset)',
        'focus':    '0 0 0 2px var(--bg), 0 0 0 4px var(--primary)',
      },

      /* ─── Spacing extras ─── */
      spacing: {
        'sidebar':   'var(--sidebar-width)',
        'sidebar-sm':'var(--sidebar-collapsed-width)',
        'header':    'var(--header-height)',
        'dock':      'var(--mobile-dock-height)',
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
        '26':  '6.5rem',
        '30':  '7.5rem',
        '34':  '8.5rem',
        '76':  '19rem',
        '88':  '22rem',
        '100': '25rem',
        '104': '26rem',
        '112': '28rem',
        '120': '30rem',
        '128': '32rem',
        '144': '36rem',
        '160': '40rem',
      },

      /* ─── Screens ─── */
      screens: {
        xs:   '480px',
        sm:   '640px',
        md:   '768px',
        lg:   '1024px',
        xl:   '1280px',
        '2xl':'1440px',
        '3xl':'1920px',
      },

      /* ─── Z-index ─── */
      zIndex: {
        'dropdown': '100',
        'sticky':   '200',
        'overlay':  '300',
        'modal':    '400',
        'toast':    '500',
        'command':  '600',
        'tooltip':  '700',
      },

      /* ─── Easing ─── */
      transitionTimingFunction: {
        'out':    'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
        'in':     'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
        'in-out': 'cubic-bezier(0.4, 0.0, 0.2, 1.0)',
        'back':   'cubic-bezier(0.34, 1.56, 0.64, 1.0)',
        'expo':   'cubic-bezier(0.16, 1.0,  0.3,  1.0)',
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },

      /* ─── Durations ─── */
      transitionDuration: {
        instant: '80ms',
        fast:    '150ms',
        base:    '250ms',
        slow:    '400ms',
        xslow:   '600ms',
      },

      /* ─── Backdrop blur ─── */
      backdropBlur: {
        xs:  '2px',
        sm:  '8px',
        md:  '16px',
        lg:  '24px',
        xl:  '40px',
        '2xl':'60px',
      },

      /* ─── Animations (Tailwind utility class versions) ─── */
      animation: {
        'fade-in':           'fadeIn 0.3s ease-out both',
        'fade-up':           'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'fade-down':         'fadeDown 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':          'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'slide-down':        'slideDown 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':          'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        'pop-in':            'popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
        'shake':             'shake 0.45s ease-in-out',
        'bounce-in':         'bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
        'pulse-slow':        'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-glow':        'pulseGlow 2s ease-in-out infinite',
        'xp-fill':           'xpFill 1.2s cubic-bezier(0.16,1,0.3,1) both',
        'level-up':          'levelUp 0.7s cubic-bezier(0.34,1.56,0.64,1) both',
        'count-up':          'countUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'spin-slow':         'spin 3s linear infinite',
        'ping-once':         'ping 0.8s cubic-bezier(0,0,0.2,1) both',
        'shimmer':           'shimmer 5s linear infinite',
        'path-draw':         'pathDraw 1.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'page-enter':        'pageEnter 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'float-a':           'floatA 7s ease-in-out infinite',
        'float-b':           'floatB 9s ease-in-out infinite 1s',
        'float-c':           'floatC 6s ease-in-out infinite 0.5s',
        'wave-1':            'wave1 0.9s ease-in-out infinite',
        'wave-2':            'wave2 0.9s ease-in-out infinite 0.1s',
        'wave-3':            'wave3 0.9s ease-in-out infinite 0.2s',
        'typing-1':          'typingDot 1.2s ease-in-out infinite',
        'typing-2':          'typingDot 1.2s ease-in-out infinite 0.15s',
        'typing-3':          'typingDot 1.2s ease-in-out infinite 0.3s',
      },

      keyframes: {
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeUp:     { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeDown:   { from: { opacity: '0', transform: 'translateY(-24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp:    { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown:  { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:    { from: { opacity: '0', transform: 'scale(0.92)' }, to: { opacity: '1', transform: 'scale(1)' } },
        popIn: {
          '0%':   { opacity: '0', transform: 'scale(0.5) rotate(-5deg)' },
          '65%':  { transform: 'scale(1.06) rotate(1deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '15%,55%': { transform: 'translateX(-5px)' },
          '35%,75%': { transform: 'translateX(5px)' },
        },
        bounceIn: {
          '0%':   { opacity: '0', transform: 'scale(0.4) rotate(-6deg)' },
          '45%':  { transform: 'scale(1.08) rotate(2deg)' },
          '70%':  { transform: 'scale(0.96) rotate(-1deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0)' },
        },
        pulseGlow: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        xpFill:    { from: { width: '0%', opacity: '0.5' }, to: { width: 'var(--xp-width, 100%)', opacity: '1' } },
        levelUp: {
          '0%':   { opacity: '0', transform: 'scale(0.5) translateY(24px)' },
          '55%':  { transform: 'scale(1.1) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.94)', filter: 'blur(4px)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)',      filter: 'blur(0)'  },
        },
        shimmer:  { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pathDraw: { from: { strokeDashoffset: '1000' }, to: { strokeDashoffset: '0' } },
        pageEnter:{
          from: { opacity: '0', transform: 'translateY(12px)', filter: 'blur(3px)' },
          to:   { opacity: '1', transform: 'translateY(0)',    filter: 'blur(0)'   },
        },
        floatA:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-16px)' } },
        floatB:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        floatC:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-20px)' } },
        wave1:      { '0%,100%': { transform: 'scaleY(0.3)' }, '50%': { transform: 'scaleY(1)' } },
        wave2:      { '0%,100%': { transform: 'scaleY(0.5)' }, '50%': { transform: 'scaleY(0.8)' } },
        wave3:      { '0%,100%': { transform: 'scaleY(0.8)' }, '50%': { transform: 'scaleY(0.4)' } },
        typingDot: {
          '0%,60%,100%': { transform: 'translateY(0)',    opacity: '0.35' },
          '30%':          { transform: 'translateY(-6px)', opacity: '1'    },
        },
      },
    },
  },
  plugins: [],
};

export default config;
