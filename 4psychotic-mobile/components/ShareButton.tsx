import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { Share2, X, Copy, Twitter, Facebook, MessageCircle, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { shareVideo, sharePlaylist, copyLinkToClipboard, shareToPlatform, ShareData } from '../lib/shareSystem';
import { trackShare } from '../lib/analytics';

const COLORS = {
  dark: '#0a0a0a',
  darkLight: '#1a1a1a',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
  neonTeal: '#00ffd1',
  neonRed: '#ff006e',
};

interface ShareButtonProps {
  data: ShareData;
  variant?: 'icon' | 'button';
  size?: number;
}

export default function ShareButton({ data, variant = 'icon', size = 20 }: ShareButtonProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = async (platform?: 'native' | 'twitter' | 'facebook' | 'whatsapp' | 'telegram' | 'copy') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    let success = false;
    
    if (!platform || platform === 'native') {
      if (data.playlistId) {
        success = await sharePlaylist(data);
      } else {
        success = await shareVideo(data);
      }
    } else if (platform === 'copy') {
      success = await copyLinkToClipboard(data);
      if (success) {
        // Show toast or feedback
        setTimeout(() => setShowShareModal(false), 500);
      }
    } else {
      success = await shareToPlatform(platform, data);
    }
    
    // Track share
    if (success) {
      trackShare(platform);
    }
    
    if (success) {
      setShowShareModal(false);
    }
  };

  if (variant === 'button') {
    return (
      <>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => {
            setShowShareModal(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Share2 size={size} color={COLORS.white} />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
        
        <ShareModal
          visible={showShareModal}
          data={data}
          onClose={() => setShowShareModal(false)}
          onShare={handleShare}
        />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.shareIcon}
        onPress={() => {
          setShowShareModal(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Share2 size={size} color={COLORS.white60} />
      </TouchableOpacity>
      
      <ShareModal
        visible={showShareModal}
        data={data}
        onClose={() => setShowShareModal(false)}
        onShare={handleShare}
      />
    </>
  );
}

interface ShareModalProps {
  visible: boolean;
  data: ShareData;
  onClose: () => void;
  onShare: (platform?: 'native' | 'twitter' | 'facebook' | 'whatsapp' | 'telegram' | 'copy') => Promise<void>;
}

function ShareModal({ visible, data, onClose, onShare }: ShareModalProps) {
  const shareOptions = [
    { id: 'native', label: 'Share', icon: Share2, color: COLORS.neonTeal },
    { id: 'copy', label: 'Copy Link', icon: Copy, color: COLORS.white60 },
    { id: 'twitter', label: 'Twitter', icon: Twitter, color: '#1DA1F2' },
    { id: 'facebook', label: 'Facebook', icon: Facebook, color: '#1877F2' },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
    { id: 'telegram', label: 'Telegram', icon: Send, color: '#0088cc' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.shareInfo}>
            <Text style={styles.shareInfoTitle} numberOfLines={2}>
              {data.title}
            </Text>
            {data.description && (
              <Text style={styles.shareInfoDescription} numberOfLines={2}>
                {data.description}
              </Text>
            )}
          </View>
          
          <ScrollView style={styles.optionsList}>
            {shareOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={styles.shareOption}
                  onPress={() => onShare(option.id as any)}
                >
                  <View style={[styles.shareOptionIcon, { backgroundColor: `${option.color}20` }]}>
                    <IconComponent size={24} color={option.color} />
                  </View>
                  <Text style={styles.shareOptionLabel}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create<{
  shareButton: ViewStyle;
  shareButtonText: TextStyle;
  shareIcon: ViewStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalHeader: ViewStyle;
  modalTitle: TextStyle;
  closeButton: ViewStyle;
  shareInfo: ViewStyle;
  shareInfoTitle: TextStyle;
  shareInfoDescription: TextStyle;
  optionsList: ViewStyle;
  shareOption: ViewStyle;
  shareOptionIcon: ViewStyle;
  shareOptionLabel: TextStyle;
}>({
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.darkLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  shareButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  shareIcon: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.darkLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff08',
    maxHeight: '70%',
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
  shareInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
    gap: 4,
  },
  shareInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 20,
  },
  shareInfoDescription: {
    fontSize: 12,
    color: COLORS.white60,
    lineHeight: 16,
  },
  optionsList: {
    padding: 20,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: COLORS.dark,
    borderRadius: 12,
    marginBottom: 12,
  },
  shareOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
