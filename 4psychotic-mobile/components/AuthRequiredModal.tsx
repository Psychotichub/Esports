import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { X, Lock, User } from 'lucide-react-native';

const COLORS = {
  dark: '#0a0e1a',
  darkLight: '#0f1420',
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
};

interface AuthRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  action: string; // e.g., "like", "comment", "follow"
}

export default function AuthRequiredModal({
  visible,
  onClose,
  action,
}: AuthRequiredModalProps) {
  const navigation = useNavigation<any>();

  const actionText: { [key: string]: string } = {
    like: 'like videos',
    comment: 'leave comments',
    follow: 'follow creators',
    share: 'share content',
    playlist: 'create playlists',
    save: 'save videos',
  };

  const actionDisplay = actionText[action] || action;

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setTimeout(() => {
      navigation.navigate('login');
    }, 300);
  };

  const handleSignup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setTimeout(() => {
      navigation.navigate('signup');
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
          >
            <X size={20} color={COLORS.white60} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Lock size={32} color={COLORS.neonRed} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Account Required</Text>

          {/* Message */}
          <Text style={styles.message}>
            You need to create an account to {actionDisplay}.
          </Text>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <User size={16} color={COLORS.neonTeal} />
              <Text style={styles.benefitText}>Like and comment on videos</Text>
            </View>
            <View style={styles.benefitItem}>
              <User size={16} color={COLORS.neonTeal} />
              <Text style={styles.benefitText}>Follow your favorite creators</Text>
            </View>
            <View style={styles.benefitItem}>
              <User size={16} color={COLORS.neonTeal} />
              <Text style={styles.benefitText}>Save videos to playlists</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignup}
              activeOpacity={0.8}
            >
              <Text style={styles.signupButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create<{
  overlay: ViewStyle;
  modal: ViewStyle;
  closeButton: ViewStyle;
  iconContainer: ViewStyle;
  iconCircle: ViewStyle;
  title: TextStyle;
  message: TextStyle;
  benefitsContainer: ViewStyle;
  benefitItem: ViewStyle;
  benefitText: TextStyle;
  buttonContainer: ViewStyle;
  signupButton: ViewStyle;
  signupButtonText: TextStyle;
  loginButton: ViewStyle;
  loginButtonText: TextStyle;
}>({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.darkLight,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#ffffff08',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.neonRed,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.dark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.dark,
    borderWidth: 2,
    borderColor: COLORS.neonRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: COLORS.white60,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  benefitsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: COLORS.white60,
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  signupButton: {
    backgroundColor: COLORS.neonRed,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  loginButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 14,
    color: COLORS.neonTeal,
    fontWeight: '600',
  },
});
