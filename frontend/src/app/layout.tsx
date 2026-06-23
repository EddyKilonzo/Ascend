import type { Metadata, Viewport } from 'next'
import { Syne } from 'next/font/google'
import { Amatic_SC } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Providers } from './providers'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

const amagro = Amatic_SC({
  subsets: ['latin'],
  variable: '--font-amagro',
  weight: ['400', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ascend — Your Productivity Operating System',
  description: 'Maya, your personal AI coach, tracks habits, plans your day, and turns every goal into measurable progress.',
  keywords: ['productivity', 'habits', 'AI coach', 'daily planner', 'analytics'],
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFFFE' },
    { media: '(prefers-color-scheme: dark)', color: '#060C0B' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} ${syne.variable} ${amagro.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
