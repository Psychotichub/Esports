# Social Media Live Stream Integration - Implementation Guide

## Overview

This implementation provides a complete social media live streaming integration system supporting YouTube, Facebook, and TikTok. It includes OAuth authentication, secure token storage, background polling, and React Native components.

## Architecture

### Backend Components

1. **Database Schema** (`drizzle/schema.ts`)
   - `socialConnections` table stores encrypted OAuth tokens and live status

2. **OAuth Handlers** (`server/oauth/`)
   - `youtube.ts` - YouTube OAuth flow
   - `facebook.ts` - Facebook OAuth flow
   - `tiktok.ts` - TikTok OAuth flow
   - `index.ts` - OAuth route handlers

3. **Token Encryption** (`server/_core/crypto.ts`)
   - AES-256-GCM encryption for storing tokens securely

4. **Social Connections** (`server/socialConnections.ts`)
   - Database operations for managing connections
   - Token encryption/decryption helpers

5. **Live Status Polling** (`server/liveStatusPolling.ts`)
   - Background service that polls platforms every 3 minutes
   - Detects state transitions (offline → live)
   - Handles token refresh automatically

6. **API Endpoints** (`server/routers.ts`)
   - `social.getConnections` - Get user's connected accounts
   - `social.getAuthUrl` - Get OAuth authorization URL
   - `social.disconnect` - Disconnect a platform
   - `social.getLiveStatus` - Get live status for a user

### Frontend Components

1. **Hooks** (`lib/hooks/useLiveStatus.ts`)
   - `useLiveStatus(userId)` - Get live status for a user
   - `useSocialConnections()` - Get current user's connections

2. **Components**
   - `LiveBadge.tsx` - Animated "LIVE" badge with pulsing effect
   - `LiveStreamEmbed.tsx` - Platform-specific embed player
   - `SocialConnectionCard.tsx` - UI for connecting/disconnecting accounts

## Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```bash
# YouTube OAuth
YOUTUBE_OAUTH_CLIENT_ID=your-client-id
YOUTUBE_OAUTH_CLIENT_SECRET=your-client-secret
YOUTUBE_OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/youtube/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/facebook/callback

# TikTok OAuth
TIKTOK_CLIENT_KEY=your-client-key
TIKTOK_CLIENT_SECRET=your-client-secret
TIKTOK_OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/tiktok/callback

# Enable live polling (optional, defaults to production only)
ENABLE_LIVE_POLLING=true
```

### 2. Database Migration

Run the database migration to create the `socialConnections` table:

```bash
cd 4psychotic-landing
pnpm db:push
```

### 3. OAuth App Setup

#### YouTube
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

#### Facebook
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. Request required permissions: `pages_read_engagement`, `pages_show_list`

#### TikTok
1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create an app
3. Configure OAuth settings
4. Add redirect URIs

## Usage

### Connecting Accounts

```typescript
import { SocialConnectionCard } from '../components/SocialConnectionCard';

// In your Profile/Settings screen
<SocialConnectionCard 
  platform="youtube" 
  userId={currentUser.id}
  onConnect={() => {
    // Handle successful connection
  }}
/>
```

### Displaying Live Status

```typescript
import { useLiveStatus } from '../lib/hooks/useLiveStatus';
import LiveBadge from '../components/LiveBadge';

function UserProfile({ userId }) {
  const { data: liveStatus } = useLiveStatus(userId);
  
  return (
    <View>
      {liveStatus && <LiveBadge liveStatus={liveStatus} />}
    </View>
  );
}
```

### Embedding Live Streams

```typescript
import LiveStreamEmbed from '../components/LiveStreamEmbed';

function LiveStreamView({ connection }) {
  if (!connection.isLive || !connection.lastLiveVideoId) {
    return <Text>Not currently live</Text>;
  }
  
  return (
    <LiveStreamEmbed
      platform={connection.platform}
      videoId={connection.lastLiveVideoId}
      url={`https://${connection.platform}.com/...`}
      autoplay={false}
      muted={true}
    />
  );
}
```

## Background Polling

The polling service runs automatically in production or when `ENABLE_LIVE_POLLING=true`. It:

- Checks live status every 3 minutes
- Refreshes expired tokens automatically
- Detects state transitions (offline → live)
- Logs when users go live

To manually trigger polling:

```typescript
import { pollLiveStatuses } from '../server/liveStatusPolling';
await pollLiveStatuses();
```

## Security Features

1. **Token Encryption**: All tokens are encrypted at rest using AES-256-GCM
2. **OAuth State Validation**: Prevents CSRF attacks
3. **Token Refresh**: Automatic token refresh when expired
4. **HTTPS Required**: All OAuth callbacks must use HTTPS in production

## Push Notifications

To implement push notifications when users go live:

1. Add notification trigger in `liveStatusPolling.ts`:
```typescript
if (!previousIsLive && liveStatus.isLive) {
  await triggerLiveNotification(connection.appUserId, connection.platform);
}
```

2. Implement `triggerLiveNotification` using your push notification service (Firebase, etc.)

## Troubleshooting

### OAuth Callback Fails
- Check redirect URIs match exactly
- Verify OAuth credentials are correct
- Check CORS settings

### Tokens Expire Frequently
- Ensure refresh tokens are being stored
- Check token expiration times
- Verify refresh token flow is working

### Live Status Not Updating
- Check polling service is running
- Verify API credentials are valid
- Check database for connection records

## Next Steps

1. Add push notification integration
2. Implement user selection for Facebook pages (if multiple)
3. Add analytics tracking for live events
4. Create admin dashboard for monitoring connections
5. Add webhook support for real-time updates (if available)
