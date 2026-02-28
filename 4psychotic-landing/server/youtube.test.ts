import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

/**
 * Test to validate YouTube API credentials
 * This test verifies that the YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID are valid
 */
describe("YouTube API Integration", () => {
  it("should have valid YouTube API credentials configured", async () => {
    // Check if credentials are set
    expect(ENV.youtubeApiKey).toBeDefined();
    expect(ENV.youtubeChannelId).toBeDefined();

    // Validate format
    expect(typeof ENV.youtubeApiKey).toBe("string");
    expect(typeof ENV.youtubeChannelId).toBe("string");
    expect(ENV.youtubeApiKey.length).toBeGreaterThan(0);
    expect(ENV.youtubeChannelId.length).toBeGreaterThan(0);
  });

  it("should be able to fetch channel data from YouTube API", async () => {
    if (!ENV.youtubeApiKey || !ENV.youtubeChannelId) {
      console.warn("Skipping YouTube API test: credentials not configured");
      return;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${ENV.youtubeChannelId}&key=${ENV.youtubeApiKey}`
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.items).toBeDefined();
      expect(data.items.length).toBeGreaterThan(0);
      expect(data.items[0].snippet).toBeDefined();
      console.log(`✓ YouTube channel found: ${data.items[0].snippet.title}`);
    } catch (error) {
      console.error("YouTube API test failed:", error);
      throw error;
    }
  });

  it("should be able to fetch live streams from YouTube API", async () => {
    if (!ENV.youtubeApiKey || !ENV.youtubeChannelId) {
      console.warn("Skipping YouTube live streams test: credentials not configured");
      return;
    }

    try {
      // Search for live streams from the channel
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${ENV.youtubeChannelId}&type=video&eventType=live&key=${ENV.youtubeApiKey}`
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.items).toBeDefined();
      console.log(`✓ YouTube API is working. Found ${data.items.length} live streams.`);
    } catch (error) {
      console.error("YouTube live streams test failed:", error);
      throw error;
    }
  });
});
