# Social Live Stream Integration – Cursor AI Implementation Prompt

## Project Context

You are working on a **React Native mobile application (TypeScript)** with a backend (Node.js assumed unless specified otherwise).

The goal is to implement a **scalable multi-platform live stream integration system** supporting:

- YouTube
- Facebook
- TikTok

The system must support:

1. OAuth account connection
2. Secure token storage
3. Channel/page identification
4. Background live status polling
5. Cached live state
6. Dynamic embed rendering
7. “Live Now” badge system
8. Push notifications when stream starts

This implementation must be production-ready, scalable, and compliant with each platform’s API policies.

---

# 🎯 High-Level Architecture Requirements

## Frontend (React Native – TypeScript)

- OAuth connect buttons for each platform
- Display connection status
- Show live badge when user is streaming
- Render embedded live stream dynamically
- Subscribe to push notifications

## Backend

- Handle OAuth callbacks
- Store encrypted access + refresh tokens
- Store platform-specific channel/page IDs
- Poll live status periodically (cron job / worker)
- Cache live state in database or Redis
- Trigger push notifications on live start event

---

# 🔐 1. OAuth Integration (All Platforms)

## Requirements

Implement OAuth flows for:

- YouTube (Google OAuth 2.0 with YouTube Data API scope)
- Facebook (Facebook Login with pages_read_engagement + pages_show_list)
- TikTok (TikTok Login Kit / OAuth)

### Expected Output

When user connects account:

Store in database:

- platform (youtube | facebook | tiktok)
- userId (internal app user)
- platformChannelId / pageId / creatorId
- accessToken (encrypted)
- refreshToken (if available)
- tokenExpiry

Tokens must be encrypted at rest.

---

# 🗂 2. Database Schema (Example)

Create a table:

```
SocialConnections
- id
- appUserId
- platform
- platformUserId
- channelOrPageId
- accessTokenEncrypted
- refreshTokenEncrypted
- expiresAt
- isLive (boolean)
- lastLiveVideoId
- lastCheckedAt
- createdAt
- updatedAt
```

---

# 🔁 3. Background Live Polling Service

Create a background worker that:

- Runs every 2–5 minutes
- Fetches active connected users
- Calls platform API to check live status
- Updates database
- Detects state transitions (offline → live)

IMPORTANT:
- Only notify when status changes
- Do not notify repeatedly while live

---

# 📡 4. Platform-Specific Live Detection

## YouTube

- Use YouTube Data API search endpoint
- Filter: eventType=live, type=video
- If result exists → extract videoId

## Facebook

- Use Graph API
- Check page live videos endpoint
- Detect active live video

## TikTok

- Use TikTok Creator API (if available)
- Check live status endpoint
- Extract live room ID or stream link

Handle API errors, expired tokens, and rate limits gracefully.

---

# ⚡ 5. Caching Strategy

Use Redis or in-memory caching to:

- Cache live status
- Reduce redundant API calls
- Serve frontend quickly

Cache TTL: 60–120 seconds

---

# 📺 6. Dynamic Embed System

Frontend must:

- Request live state from backend
- If isLive = true:
  - Render platform-specific embed
- If false:
  - Show offline UI

### Embed Format Examples

YouTube:
```
https://www.youtube.com/embed/VIDEO_ID
```

Facebook:
```
https://www.facebook.com/plugins/video.php?href=VIDEO_URL
```

TikTok:
Use official embed player URL

Ensure embeds are responsive and performant.

---

# 🔴 7. “Live Now” Badge System

Frontend Requirements:

- Red pulsing badge
- Display viewer count if available
- Show on:
  - Profile screen
  - Home feed
  - User cards

Badge visibility must depend on backend live state.

---

# 🔔 8. Push Notification System

When backend detects offline → live transition:

Trigger push notification:

"🔴 {Username} is now live on {Platform}!"

Use:
- Firebase Cloud Messaging (recommended)

Ensure:
- Only followers receive notification
- Deduplicate notifications

---

# 🧠 9. Scalability Considerations

- Do not poll every user every minute
- Only poll recently active users
- Batch API calls where possible
- Respect rate limits
- Queue background jobs

---

# 🔒 10. Security Requirements

- Encrypt tokens
- Validate OAuth state parameter
- Use HTTPS everywhere
- Rate limit API endpoints
- Handle token refresh securely

---

# 📱 11. React Native Implementation Requirements

- TypeScript strict mode enabled
- Create reusable hook: useLiveStatus(userId)
- Create reusable component: <LiveStreamEmbed />
- Create reusable component: <LiveBadge />
- Handle loading + error states

---

# 🎯 Expected Deliverables

Cursor AI should generate:

1. Backend OAuth implementation (Node.js example)
2. Database schema migration
3. Live polling worker implementation
4. REST endpoints:
   - GET /live-status/:userId
   - POST /connect/:platform
5. React Native integration
6. Push notification trigger logic

---

# 🚀 Goal

Build a scalable, secure, production-ready multi-platform live streaming detection and embed system for a React Native TypeScript application.

The system must be modular, maintainable, and extensible to future platforms.

