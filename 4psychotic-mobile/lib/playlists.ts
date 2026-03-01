import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  videoIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface VideoItem {
  id: number;
  title: string;
  category: string;
  views: string;
  date: string;
  url: string;
  color: string;
}

const PLAYLISTS_KEY = '@playlists';

// Get all playlists
export async function getPlaylists(): Promise<Playlist[]> {
  try {
    const data = await AsyncStorage.getItem(PLAYLISTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting playlists:', error);
    return [];
  }
}

// Save playlists
export async function savePlaylists(playlists: Playlist[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  } catch (error) {
    console.error('Error saving playlists:', error);
  }
}

// Create a new playlist
export async function createPlaylist(name: string, description?: string): Promise<Playlist> {
  const playlists = await getPlaylists();
  const newPlaylist: Playlist = {
    id: Date.now().toString(),
    name,
    description,
    videoIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  playlists.push(newPlaylist);
  await savePlaylists(playlists);
  return newPlaylist;
}

// Update a playlist
export async function updatePlaylist(playlistId: string, updates: Partial<Playlist>): Promise<Playlist | null> {
  const playlists = await getPlaylists();
  const index = playlists.findIndex(p => p.id === playlistId);
  if (index === -1) return null;
  
  playlists[index] = {
    ...playlists[index],
    ...updates,
    updatedAt: Date.now(),
  };
  await savePlaylists(playlists);
  return playlists[index];
}

// Delete a playlist
export async function deletePlaylist(playlistId: string): Promise<boolean> {
  const playlists = await getPlaylists();
  const filtered = playlists.filter(p => p.id !== playlistId);
  await savePlaylists(filtered);
  return filtered.length < playlists.length;
}

// Add video to playlist
export async function addVideoToPlaylist(playlistId: string, videoId: string): Promise<boolean> {
  const playlists = await getPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) return false;
  
  if (!playlist.videoIds.includes(videoId)) {
    playlist.videoIds.push(videoId);
    playlist.updatedAt = Date.now();
    await savePlaylists(playlists);
    return true;
  }
  return false;
}

// Remove video from playlist
export async function removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<boolean> {
  const playlists = await getPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) return false;
  
  const index = playlist.videoIds.indexOf(videoId);
  if (index > -1) {
    playlist.videoIds.splice(index, 1);
    playlist.updatedAt = Date.now();
    await savePlaylists(playlists);
    return true;
  }
  return false;
}

// Get playlists containing a video
export async function getPlaylistsForVideo(videoId: string): Promise<Playlist[]> {
  const playlists = await getPlaylists();
  return playlists.filter(p => p.videoIds.includes(videoId));
}

// Get playlist count for a video
export async function getPlaylistCountForVideo(videoId: string): Promise<number> {
  const playlists = await getPlaylists();
  return playlists.filter(p => p.videoIds.includes(videoId)).length;
}

// Get all video IDs in playlists (for showing count on cards)
export async function getAllPlaylistedVideoIds(): Promise<Set<string>> {
  const playlists = await getPlaylists();
  const videoIds = new Set<string>();
  playlists.forEach(playlist => {
    playlist.videoIds.forEach(id => videoIds.add(id));
  });
  return videoIds;
}
