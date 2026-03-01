import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getYouTubeLiveStatus, getYouTubeChannelStats, getYouTubeRecentVideos } from "./youtube";
import { getAllLiveStreams } from "./liveStreams";
import { 
  getUserSocialConnections, 
  getSocialConnection, 
  deleteSocialConnection,
  getDecryptedAccessToken 
} from "./socialConnections";
import { getYouTubeAuthUrl } from "./oauth/youtube";
import { getFacebookAuthUrl } from "./oauth/facebook";
import { getTikTokAuthUrl } from "./oauth/tiktok";
import crypto from "crypto";
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
    // New: Get all live streams from all platforms
    liveStreams: publicProcedure.query(async () => {
      return await getAllLiveStreams();
    }),
  }),

  social: router({
    // ── Authenticated endpoints (require backend session) ─────────────────

    // Get the current backend-session user's social connections
    getConnections: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error('Unauthorized');
      }
      const connections = await getUserSocialConnections(ctx.user.id);
      return connections.map(conn => ({
        id: conn.id,
        platform: conn.platform,
        platformUserId: conn.platformUserId,
        channelOrPageId: conn.channelOrPageId,
        isLive: conn.isLive === 'true' || conn.isLive === 1,
        lastLiveVideoId: conn.lastLiveVideoId,
        lastCheckedAt: conn.lastCheckedAt,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt,
      }));
    }),

    // Get OAuth authorization URL (session-authenticated)
    getAuthUrl: publicProcedure
      .input(z.object({ platform: z.enum(['youtube', 'facebook', 'tiktok']) }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error('Unauthorized');
        const state = crypto.randomBytes(32).toString('hex');
        let authUrl: string;
        switch (input.platform) {
          case 'youtube':  authUrl = getYouTubeAuthUrl(state);  break;
          case 'facebook': authUrl = getFacebookAuthUrl(state); break;
          case 'tiktok':   authUrl = getTikTokAuthUrl(state);   break;
        }
        return { authUrl, state };
      }),

    // Disconnect (session-authenticated)
    disconnect: publicProcedure
      .input(z.object({ platform: z.enum(['youtube', 'facebook', 'tiktok']) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error('Unauthorized');
        await deleteSocialConnection(ctx.user.id, input.platform);
        return { success: true };
      }),

    // ── Public endpoints (no backend session needed) ──────────────────────
    //  These use the mobile app's local numeric userId (derived from the
    //  user's email hash) which is also passed to /api/oauth/:platform/authorize.

    /**
     * getConnectionStatus — used by the mobile app to check which platforms
     * a user has connected after completing the OAuth browser flow.
     */
    getConnectionStatus: publicProcedure
      .input(z.object({ appUserId: z.number() }))
      .query(async ({ input }) => {
        const connections = await getUserSocialConnections(input.appUserId);
        return connections.map(conn => {
          const isLive = conn.isLive === 'true' || conn.isLive === 1 || conn.isLive === '1';
          return {
            platform: conn.platform as 'youtube' | 'facebook' | 'tiktok',
            channelOrPageId: conn.channelOrPageId,
            platformUserId: conn.platformUserId,
            isLive,
            lastLiveVideoId: conn.lastLiveVideoId,
            connectedAt: conn.createdAt,
          };
        });
      }),

    /**
     * publicDisconnect — lets the mobile app remove a connection without
     * needing a backend session cookie.
     */
    publicDisconnect: publicProcedure
      .input(
        z.object({
          appUserId: z.number(),
          platform: z.enum(['youtube', 'facebook', 'tiktok']),
        })
      )
      .mutation(async ({ input }) => {
        await deleteSocialConnection(input.appUserId, input.platform);
        return { success: true };
      }),

    // Get live status for a specific user (kept for hook compatibility)
    getLiveStatus: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const connections = await getUserSocialConnections(input.userId);
        return connections.map(conn => ({
          platform: conn.platform,
          isLive: conn.isLive === 'true' || conn.isLive === 1,
          lastLiveVideoId: conn.lastLiveVideoId,
          lastCheckedAt: conn.lastCheckedAt,
        }));
      }),
  }),
});

export type AppRouter = typeof appRouter;
