import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Play, Trash2, Edit2, X, ListMusic } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import TopNavBar from '../../components/TopNavBar';
import {
  getPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  Playlist,
} from '../../lib/playlists';
import { trackPlaylistCreation } from '../../lib/analytics';

const COLORS = {
  dark: '#0a0a0a',
  darkLight: '#1a1a1a',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
  neonTeal: '#00ffd1',
  neonRed: '#ff006e',
};

export default function PlaylistsScreen() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    const data = await getPlaylists();
    setPlaylists(data);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await createPlaylist(newPlaylistName.trim(), newPlaylistDescription.trim() || undefined);
    trackPlaylistCreation();
    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setShowCreateModal(false);
    await loadPlaylists();
  };

  const handleEditPlaylist = async () => {
    if (!editingPlaylist || !newPlaylistName.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updatePlaylist(editingPlaylist.id, {
      name: newPlaylistName.trim(),
      description: newPlaylistDescription.trim() || undefined,
    });
    setEditingPlaylist(null);
    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setShowEditModal(false);
    await loadPlaylists();
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await deletePlaylist(playlistId);
    await loadPlaylists();
  };

  const openEditModal = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setNewPlaylistName(playlist.name);
    setNewPlaylistDescription(playlist.description || '');
    setShowEditModal(true);
  };

  const renderPlaylist = ({ item }: { item: Playlist }) => (
    <TouchableOpacity
      style={styles.playlistCard}
      onPress={() => {
        // Navigate to playlist detail (can be implemented later)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      activeOpacity={0.8}
    >
      <View style={styles.playlistHeader}>
        <View style={styles.playlistIcon}>
          <ListMusic size={24} color={COLORS.neonTeal} />
        </View>
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.description && (
            <Text style={styles.playlistDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <Text style={styles.playlistMeta}>
            {item.videoIds.length} {item.videoIds.length === 1 ? 'video' : 'videos'}
          </Text>
        </View>
        <View style={styles.playlistActions}>
          {item.videoIds.length > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // Play all videos (can be implemented later)
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <Play size={18} color={COLORS.neonTeal} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Edit2 size={18} color={COLORS.white60} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeletePlaylist(item.id)}
          >
            <Trash2 size={18} color={COLORS.neonRed} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopNavBar title="My Playlists" />
      
      {playlists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ListMusic size={64} color={COLORS.white40} />
          <Text style={styles.emptyTitle}>No Playlists Yet</Text>
          <Text style={styles.emptyText}>
            Create your first playlist to organize your favorite videos
          </Text>
        </View>
      ) : (
        <FlatList
          data={playlists}
          renderItem={renderPlaylist}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Playlist Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setShowCreateModal(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <Plus size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* Create Playlist Modal */}
      <Modal
        visible={showCreateModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Playlist</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="My Playlist"
                  placeholderTextColor={COLORS.white40}
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  autoFocus
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add a description..."
                  placeholderTextColor={COLORS.white40}
                  value={newPlaylistDescription}
                  onChangeText={setNewPlaylistDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, !newPlaylistName.trim() && styles.createButtonDisabled]}
                onPress={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Playlist Modal */}
      <Modal
        visible={showEditModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Playlist</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="My Playlist"
                  placeholderTextColor={COLORS.white40}
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  autoFocus
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add a description..."
                  placeholderTextColor={COLORS.white40}
                  value={newPlaylistDescription}
                  onChangeText={setNewPlaylistDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, !newPlaylistName.trim() && styles.createButtonDisabled]}
                onPress={handleEditPlaylist}
                disabled={!newPlaylistName.trim()}
              >
                <Text style={styles.createButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  listContent: ViewStyle;
  emptyContainer: ViewStyle;
  emptyTitle: TextStyle;
  emptyText: TextStyle;
  playlistCard: ViewStyle;
  playlistHeader: ViewStyle;
  playlistIcon: ViewStyle;
  playlistInfo: ViewStyle;
  playlistName: TextStyle;
  playlistDescription: TextStyle;
  playlistMeta: TextStyle;
  playlistActions: ViewStyle;
  actionButton: ViewStyle;
  fab: ViewStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalHeader: ViewStyle;
  modalTitle: TextStyle;
  closeButton: ViewStyle;
  modalBody: ViewStyle;
  inputGroup: ViewStyle;
  inputLabel: TextStyle;
  input: TextStyle;
  textArea: TextStyle;
  modalFooter: ViewStyle;
  cancelButton: ViewStyle;
  cancelButtonText: TextStyle;
  createButton: ViewStyle;
  createButtonDisabled: ViewStyle;
  createButtonText: TextStyle;
}>({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.white60,
    textAlign: 'center',
    lineHeight: 20,
  },
  playlistCard: {
    backgroundColor: COLORS.darkLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffffff08',
    padding: 16,
  },
  playlistHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  playlistIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.neonTeal}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    flex: 1,
    gap: 4,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  playlistDescription: {
    fontSize: 12,
    color: COLORS.white60,
    lineHeight: 16,
  },
  playlistMeta: {
    fontSize: 11,
    color: COLORS.white40,
    fontWeight: '600',
  },
  playlistActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.neonTeal,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.neonTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.darkLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffff08',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white60,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.dark,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.dark,
    borderWidth: 1,
    borderColor: '#ffffff08',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white60,
  },
  createButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.neonTeal,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
});
