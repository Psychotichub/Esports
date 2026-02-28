import React, { useState } from 'react';
import { Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { trpc, type AppRouter } from './trpc';

/**
 * Get the API URL with platform-specific localhost handling
 * - Web: localhost works fine
 * - iOS Simulator: localhost works fine
 * - Android Emulator: localhost must be replaced with 10.0.2.2
 * - Physical devices: Use your computer's IP address (e.g., 192.168.1.100)
 * 
 * Priority: EXPO_PUBLIC_API_URL environment variable > default URL
 */
function getApiUrl(): string {
  // Get URL from environment variable (required)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const defaultUrl = 'http://localhost:3000/api/trpc';
  
  // Use environment variable if set, otherwise use localhost default
  let apiUrl = envUrl || defaultUrl;

  // Fix any typos (trcp -> trpc) - handles common typo
  apiUrl = apiUrl.replace('/api/trcp', '/api/trpc');
  
  // If using env URL and it doesn't include /api/trpc, append it
  if (envUrl && !apiUrl.includes('/api/trpc')) {
    // Remove trailing slash if present, then append /api/trpc
    apiUrl = apiUrl.replace(/\/$/, '') + '/api/trpc';
  }

  // If URL contains localhost and we're on Android, replace with 10.0.2.2
  if (Platform.OS === 'android' && apiUrl.includes('localhost')) {
    apiUrl = apiUrl.replace('localhost', '10.0.2.2');
  }

  // For web and iOS, localhost works as-is
  return apiUrl;
}

const API_URL = getApiUrl();

// Log the API URL in development for debugging
if (__DEV__) {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  console.log('[TRPC] API URL:', API_URL);
  if (envUrl) {
    console.log('[TRPC] Using EXPO_PUBLIC_API_URL from environment:', envUrl);
  } else {
    console.log('[TRPC] Using default URL (EXPO_PUBLIC_API_URL not set)');
  }
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: API_URL,
          transformer: superjson,
          fetch(input, init) {
            return fetch(input, {
              ...(init ?? {}),
              credentials: 'include',
            }).catch((error) => {
              // Log fetch errors for debugging
              if (__DEV__) {
                const url = typeof input === 'string' 
                  ? input 
                  : input instanceof Request 
                    ? input.url 
                    : String(input);
                
                console.error('[TRPC] Fetch error:', {
                  url,
                  error: error.message,
                  apiUrl: API_URL,
                });
                
                // Provide helpful error message if server is not reachable
                if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
                  console.error(
                    '\n⚠️  Backend server is not reachable!\n' +
                    `   Trying to connect to: ${API_URL}\n` +
                    '   To fix this:\n' +
                    '   1. Make sure the backend server is running\n' +
                    '   2. Navigate to: 4psychotic-landing\n' +
                    '   3. Run: npm run dev\n' +
                    '   4. The server should start on http://localhost:3000\n'
                  );
                }
              }
              throw error;
            });
          },
        }),
      ],
    })
  );

  // Type assertion needed due to TypeScript inference issue with createTRPCReact
  // The Provider exists at runtime, but TypeScript has trouble inferring the type
  const TrpcProvider = (trpc as unknown as { Provider: React.ComponentType<{
    client: typeof trpcClient;
    queryClient: QueryClient;
    children: React.ReactNode;
  }> }).Provider;

  return (
    <TrpcProvider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </TrpcProvider>
  );
}
