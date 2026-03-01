import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = '@4psychotic:searchHistory';
const MAX_HISTORY_ITEMS = 10;

/**
 * Save search query to history
 */
export async function saveSearchHistory(query: string): Promise<void> {
  if (!query.trim()) return;
  
  try {
    const history = await getSearchHistory();
    const trimmedQuery = query.trim().toLowerCase();
    
    // Remove if already exists
    const filtered = history.filter(h => h.toLowerCase() !== trimmedQuery);
    
    // Add to beginning
    const updated = [trimmedQuery, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

/**
 * Get search history
 */
export async function getSearchHistory(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting search history:', error);
    return [];
  }
}

/**
 * Clear search history
 */
export async function clearSearchHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}
