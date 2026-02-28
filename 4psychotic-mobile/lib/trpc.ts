import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@landing/server/routers';

export const trpc = createTRPCReact<AppRouter>();
export type { AppRouter };