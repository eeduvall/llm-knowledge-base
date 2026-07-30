'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

type Props = {
  children: React.ReactNode
}

export function QueryProvider({ children }: Props) {
  // Create a stable QueryClient per component instance (avoids sharing state
  // between requests in SSR and prevents stale data across tests).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep data fresh for 60 s before a background refetch
            staleTime: 60_000,
            // Retry once on failure (network hiccup)
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
