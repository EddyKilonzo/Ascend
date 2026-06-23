'use client'

import { useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider'

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:            1000 * 60,       // 1 min default
        gcTime:               1000 * 60 * 10,  // 10 min cache
        retry:                1,
        retryDelay:           attemptIndex => Math.min(1000 * 2 ** attemptIndex, 8000),
        refetchOnWindowFocus: false,
        refetchOnMount:       true,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>

        <Toaster
          position="bottom-right"
          expand={false}
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              background:   'var(--bg-card)',
              border:       '1px solid var(--border)',
              color:        'var(--text)',
              borderRadius: 'var(--radius-lg)',
              fontSize:     '0.875rem',
              fontFamily:   'var(--font-geist-sans), Geist, system-ui, sans-serif',
              boxShadow:    'var(--shadow-4)',
            },
            classNames: {
              toast:       'elevation-4',
              title:       'font-semibold',
              description: 'text-[var(--text-muted)]',
              actionButton:'bg-[var(--primary)] text-white hover:opacity-90',
              cancelButton:'text-[var(--text-muted)] hover:text-[var(--text)]',
              closeButton: 'hover:bg-[var(--bg-raised)]',
            },
          }}
        />
        </ThemeProvider>
    </QueryClientProvider>
  )
}
