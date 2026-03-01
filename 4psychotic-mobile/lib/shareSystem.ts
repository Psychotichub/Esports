import { Share, Linking, Platform, Clipboard } from 'react-native';

export interface ShareData {
  videoId?: string;
  videoUrl?: string;
  title: string;
  description?: string;
  timestamp?: number; // For timestamped clips
  playlistId?: string;
  playlistName?: string;
}

// Generate shareable link
export function generateShareLink(data: ShareData): string {
  const baseUrl = Platform.OS === 'web' 
    ? window.location.origin 
    : 'https://4psychotic.app'; // Replace with your actual domain
  
  if (data.videoId) {
    const url = `${baseUrl}/video/${data.videoId}`;
    if (data.timestamp) {
      return `${url}?t=${data.timestamp}`;
    }
    return url;
  }
  
  if (data.playlistId) {
    return `${baseUrl}/playlist/${data.playlistId}`;
  }
  
  return baseUrl;
}

// Share video
export async function shareVideo(data: ShareData): Promise<boolean> {
  try {
    const shareLink = generateShareLink(data);
    const message = data.timestamp
      ? `Check out this moment from "${data.title}" at ${formatTimestamp(data.timestamp)}\n\n${shareLink}`
      : `Check out "${data.title}"\n\n${shareLink}`;
    
    const result = await Share.share({
      message: Platform.OS === 'ios' ? message : `${message}\n\n${data.description || ''}`,
      title: data.title,
      url: Platform.OS === 'ios' ? shareLink : undefined,
    });
    
    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Error sharing video:', error);
    return false;
  }
}

// Share playlist
export async function sharePlaylist(data: ShareData): Promise<boolean> {
  try {
    if (!data.playlistId || !data.playlistName) return false;
    
    const shareLink = generateShareLink(data);
    const message = `Check out my playlist: "${data.playlistName}"\n\n${shareLink}`;
    
    const result = await Share.share({
      message,
      title: data.playlistName,
      url: Platform.OS === 'ios' ? shareLink : undefined,
    });
    
    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Error sharing playlist:', error);
    return false;
  }
}

// Copy link to clipboard
export async function copyLinkToClipboard(data: ShareData): Promise<boolean> {
  try {
    const link = generateShareLink(data);
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(link);
    } else {
      Clipboard.setString(link);
    }
    return true;
  } catch (error) {
    console.error('Error copying link:', error);
    return false;
  }
}

// Share to specific platform
export async function shareToPlatform(
  platform: 'twitter' | 'facebook' | 'whatsapp' | 'telegram',
  data: ShareData
): Promise<boolean> {
  try {
    const shareLink = generateShareLink(data);
    let url = '';
    
    const message = encodeURIComponent(
      data.timestamp
        ? `Check out this moment from "${data.title}" at ${formatTimestamp(data.timestamp)} ${shareLink}`
        : `Check out "${data.title}" ${shareLink}`
    );
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${message}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${message}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(data.title)}`;
        break;
    }
    
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error sharing to ${platform}:`, error);
    return false;
  }
}

// Format timestamp for display
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Generate share preview card data (for social media)
export function generateSharePreview(data: ShareData): {
  title: string;
  description: string;
  imageUrl?: string;
  url: string;
} {
  return {
    title: data.title,
    description: data.description || `Watch "${data.title}" on 4Psychotic`,
    imageUrl: data.videoId ? `https://img.youtube.com/vi/${data.videoId}/maxresdefault.jpg` : undefined,
    url: generateShareLink(data),
  };
}
