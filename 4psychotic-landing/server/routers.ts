import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getYouTubeLiveStatus, getYouTubeChannelStats, getYouTubeRecentVideos } from "./youtube";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  youtube: router({
    liveStatus: publicProcedure.query(async () => {
      return await getYouTubeLiveStatus();
    }),
    channelStats: publicProcedure.query(async () => {
      return await getYouTubeChannelStats();
    }),
    recentVideos: publicProcedure
      .input(
        z.object({
          maxResults: z.number().min(1).max(50).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return await getYouTubeRecentVideos(input?.maxResults || 6);
      }),
  }),
});

export type AppRouter = typeof appRouter;
