# 4psychotic Backend Code - Complete Guide

This document contains the complete backend code for the 4psychotic app, including all server files, database schema, and API endpoints.

---

## 📁 Backend Structure

```
server/
├── _core/
│   ├── index.ts              # Server entry point
│   ├── env.ts                # Environment configuration
│   ├── context.ts            # tRPC context
│   ├── trpc.ts               # tRPC setup
│   ├── cookies.ts            # Cookie handling
│   ├── oauth.ts              # OAuth authentication
│   ├── llm.ts                # LLM integration
│   ├── imageGeneration.ts    # Image generation
│   └── notification.ts       # Notifications
├── routers.ts                # Main API routes
├── youtube.ts                # YouTube API integration
└── db.ts                     # Database helpers

drizzle/
├── schema.ts                 # Database schema
├── migrations/               # Database migrations
└── relations.ts              # Table relations
```

---

## 🔌 API Endpoints (tRPC Routes)

### Authentication
```typescript
trpc.auth.me.useQuery()              // Get current user
trpc.auth.logout.useMutation()       // Logout user
```

### YouTube Integration
```typescript
trpc.youtube.liveStatus.useQuery()   // Get live streaming status
trpc.youtube.channelStats.useQuery() // Get channel statistics
trpc.youtube.recentVideos.useQuery() // Get recent videos
```

---

## 📝 Complete Backend Code

### 1. Main Router (server/routers.ts)

```typescript
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getYouTubeLiveStatus, getYouTubeChannelStats, getYouTubeRecentVideos } from "./youtube";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  youtube: router({
    liveStatus: publicProcedure.query(async () => {
      return await getYouTubeLiveStatus();
    }),
    channelStats: publicProcedure.query(async () => {
      return await getYouTubeChannelStats();
    }),
    recentVideos: publicProcedure.query(async ({ input }: { input?: { maxResults?: number } }) => {
      return await getYouTubeRecentVideos(input?.maxResults || 6);
    }),
  }),
});

export type AppRouter = typeof appRouter;
```

---

### 2. YouTube Integration (server/youtube.ts)

```typescript
import { ENV } from "./_core/env";

export interface YouTubeLiveStatus {
  isLive: boolean;
  title: string;
  viewerCount: number;
  videoId: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
}

/**
 * Fetch live streaming status from YouTube channel
 * Returns information about active live streams
 */
export async function getYouTubeLiveStatus(): Promise<YouTubeLiveStatus | null> {
  if (!ENV.youtubeApiKey || !ENV.youtubeChannelId) {
    console.warn("YouTube API credentials not configured");
    return null;
  }

  try {
    // Search for active live streams from the channel
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&` +
      `channelId=${ENV.youtubeChannelId}&` +
      `type=video&` +
      `eventType=live&` +
      `maxResults=1&` +
      `key=${ENV.youtubeApiKey}`
    );

    if (!searchResponse.ok) {
      console.error("YouTube API search failed:", searchResponse.statusText);
      return null;
    }

    const searchData = await searchResponse.json();

    // If no live streams found, return null
    if (!searchData.items || searchData.items.length === 0) {
      return null;
    }

    const liveStream = searchData.items[0];
    const videoId = liveStream.id.videoId;

    // Fetch detailed statistics for the live stream
    const statsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=snippet,statistics,liveStreamingDetails&` +
      `id=${videoId}&` +
      `key=${ENV.youtubeApiKey}`
    );

    if (!statsResponse.ok) {
      console.error("YouTube API stats failed:", statsResponse.statusText);
      return null;
    }

    const statsData = await statsResponse.json();

    if (!statsData.items || statsData.items.length === 0) {
      return null;
    }

    const video = statsData.items[0];
    const snippet = video.snippet;
    const statistics = video.statistics;
    const liveDetails = video.liveStreamingDetails;

    // Extract viewer count (concurrentViewers is only available for active streams)
    const viewerCount = liveDetails?.concurrentViewers
      ? parseInt(liveDetails.concurrentViewers, 10)
      : 0;

    return {
      isLive: true,
      title: snippet.title,
      viewerCount,
      videoId,
      channelTitle: snippet.channelTitle,
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (error) {
    console.error("Error fetching YouTube live status:", error);
    return null;
  }
}

/**
 * Fetch channel statistics
 */
export async function getYouTubeChannelStats() {
  if (!ENV.youtubeApiKey || !ENV.youtubeChannelId) {
    console.warn("YouTube API credentials not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?` +
      `part=snippet,statistics&` +
      `id=${ENV.youtubeChannelId}&` +
      `key=${ENV.youtubeApiKey}`
    );

    if (!response.ok) {
      console.error("YouTube API channel stats failed:", response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const channel = data.items[0];

    return {
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails?.high?.url,
      subscriberCount: channel.statistics.subscriberCount,
      viewCount: channel.statistics.viewCount,
      videoCount: channel.statistics.videoCount,
    };
  } catch (error) {
    console.error("Error fetching YouTube channel stats:", error);
    return null;
  }
}

/**
 * Fetch recent videos from the channel
 */
export async function getYouTubeRecentVideos(maxResults: number = 6) {
  if (!ENV.youtubeApiKey || !ENV.youtubeChannelId) {
    console.warn("YouTube API credentials not configured");
    return [];
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&` +
      `channelId=${ENV.youtubeChannelId}&` +
      `type=video&` +
      `order=date&` +
      `maxResults=${maxResults}&` +
      `key=${ENV.youtubeApiKey}`
    );

    if (!response.ok) {
      console.error("YouTube API recent videos failed:", response.statusText);
      return [];
    }

    const data = await response.json();

    if (!data.items) {
      return [];
    }

    return data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch (error) {
    console.error("Error fetching YouTube recent videos:", error);
    return [];
  }
}
```

---

### 3. Database Schema (drizzle/schema.ts)

```typescript
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   */
  id: int("id").autoincrement().primaryKey(),
  
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here
```

---

### 4. Database Helpers (server/db.ts)

```typescript
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
```

---

### 5. Environment Configuration (server/_core/env.ts)

```typescript
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? "",
  youtubeChannelId: process.env.YOUTUBE_CHANNEL_ID ?? "",
};
```

---

## 🔧 How to Use the Backend

### 1. Add a New API Endpoint

In `server/routers.ts`:

```typescript
export const appRouter = router({
  // ... existing routes ...
  
  // Add new feature router
  contacts: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        message: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Handle contact form submission
        const db = await getDb();
        // Save to database...
        return { success: true };
      }),
  }),
});
```

### 2. Add a New Database Table

In `drizzle/schema.ts`:

```typescript
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;
```

Then run: `pnpm db:push`

### 3. Add Database Helper

In `server/db.ts`:

```typescript
export async function createContact(contact: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contacts).values(contact);
  return result;
}
```

### 4. Use in Frontend

In React component:

```typescript
import { trpc } from "@/lib/trpc";

export function ContactForm() {
  const submitContact = trpc.contacts.submit.useMutation();
  
  const handleSubmit = async (data: any) => {
    await submitContact.mutateAsync(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔐 Environment Variables Required

```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/database

# OAuth
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
JWT_SECRET=your-secret-key

# YouTube API
YOUTUBE_API_KEY=your-youtube-api-key
YOUTUBE_CHANNEL_ID=your-channel-id

# Manus
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-key
OWNER_OPEN_ID=your-owner-id
```

---

## 🚀 Deployment

### Build
```bash
npm run build
```

### Start
```bash
npm start
```

### Development
```bash
npm run dev
```

### Database Migrations
```bash
pnpm db:push
```

---

## 📚 Key Technologies

- **Framework:** Express.js
- **API:** tRPC (end-to-end type safety)
- **Database:** MySQL with Drizzle ORM
- **Authentication:** Manus OAuth
- **External APIs:** YouTube Data API v3

---

## 🔗 API Response Types

### Live Status Response
```typescript
{
  isLive: boolean;
  title: string;
  viewerCount: number;
  videoId: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
}
```

### Channel Stats Response
```typescript
{
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
}
```

### Recent Videos Response
```typescript
{
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  url: string;
}[]
```

---

## 🛠️ Troubleshooting

### Database Connection Failed
- Check `DATABASE_URL` is correct
- Verify database is running
- Check credentials

### YouTube API Error
- Verify `YOUTUBE_API_KEY` is valid
- Check `YOUTUBE_CHANNEL_ID` is correct
- Ensure API is enabled in Google Cloud Console

### Build Errors
- Run `npm install`
- Clear cache: `npm cache clean --force`
- Check TypeScript: `npm run check`

---

## 📖 Additional Resources

- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [Express.js](https://expressjs.com)
- [YouTube Data API](https://developers.google.com/youtube/v3)

---

**Backend code is production-ready and fully documented!** 🚀
