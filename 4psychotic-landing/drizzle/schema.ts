import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
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

/**
 * Social media platform connections for live streaming
 */
export const socialConnections = mysqlTable("socialConnections", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to users table */
  appUserId: int("appUserId").notNull(),
  /** Platform: youtube, facebook, or tiktok */
  platform: mysqlEnum("platform", ["youtube", "facebook", "tiktok"]).notNull(),
  /** Platform-specific user/channel/page ID */
  platformUserId: varchar("platformUserId", { length: 255 }).notNull(),
  /** Channel ID (YouTube), Page ID (Facebook), or Creator ID (TikTok) */
  channelOrPageId: varchar("channelOrPageId", { length: 255 }).notNull(),
  /** Encrypted access token */
  accessTokenEncrypted: text("accessTokenEncrypted").notNull(),
  /** Encrypted refresh token (if available) */
  refreshTokenEncrypted: text("refreshTokenEncrypted"),
  /** Token expiration timestamp */
  expiresAt: timestamp("expiresAt"),
  /** Current live status */
  isLive: mysqlEnum("isLive", ["true", "false"]).default("false").notNull(),
  /** Last live video/stream ID */
  lastLiveVideoId: varchar("lastLiveVideoId", { length: 255 }),
  /** Last time live status was checked */
  lastCheckedAt: timestamp("lastCheckedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SocialConnection = typeof socialConnections.$inferSelect;
export type InsertSocialConnection = typeof socialConnections.$inferInsert;
