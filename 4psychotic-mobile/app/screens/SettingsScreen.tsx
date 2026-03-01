import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Check } from 'lucide-react-native';
import TopNavBar from '../../components/TopNavBar';

const { width } = Dimensions.get('window');

const COLORS = {
  dark: '#0a0e1a',
  darkLight: '#0f1420',
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
};

export default function SettingsScreen() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.subject || !form.message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      setLoading(false);

      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopNavBar title="Get In Touch" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>
            Reach out for collaborations, sponsorships, or just to say hello
          </Text>
        </View>

        {submitted ? (
          <View style={styles.successContainer}>
            <View
              style={[
                styles.successIcon,
                {
                  borderColor: COLORS.neonTeal,
                  backgroundColor: `${COLORS.neonTeal}20`,
                },
              ]}
            >
              <Check size={32} color={COLORS.neonTeal} strokeWidth={3} />
            </View>
            <Text style={styles.successTitle}>MESSAGE SENT</Text>
            <Text style={styles.successMessage}>
              Thanks for reaching out! I'll get back to you soon.
            </Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            {/* Name Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={COLORS.white40}
                value={form.name}
                onChangeText={(text) =>
                  setForm({ ...form, name: text })
                }
              />
            </View>

            {/* Email Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={COLORS.white40}
                keyboardType="email-address"
                value={form.email}
                onChangeText={(text) =>
                  setForm({ ...form, email: text })
                }
              />
            </View>

            {/* Subject Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="Collaboration / Sponsorship / Other"
                placeholderTextColor={COLORS.white40}
                value={form.subject}
                onChangeText={(text) =>
                  setForm({ ...form, subject: text })
                }
              />
            </View>

            {/* Message Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                placeholder="Tell me about your project or idea..."
                placeholderTextColor={COLORS.white40}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={form.message}
                onChangeText={(text) =>
                  setForm({ ...form, message: text })
                }
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: COLORS.neonRed },
                loading && { opacity: 0.7 },
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Send size={16} color={COLORS.white} />
                  <Text style={styles.submitButtonText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Additional Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Other Ways to Connect</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>contact@4psychotic.com</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Social Media</Text>
            <Text style={styles.infoValue}>
              Facebook: facebook.com/psy243{'\n'}
              Instagram: @4psychotic{'\n'}
              YouTube: @sureshpokharel243{'\n'}
              Twitter: @4psychotic
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>Bucharest, Romania</Text>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>4psychotic Mobile v1.0.0</Text>
          <Text style={styles.appCopyright}>
            © 2025 4psychotic. All rights reserved.
          </Text>
          <Text style={styles.appTagline}>🕉️ PSYCHEDELIC GAMING</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.dark,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.white60,
    lineHeight: 16,
  },
  successContainer: {
    paddingVertical: 60,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 16,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
  },
  successMessage: {
    fontSize: 13,
    color: COLORS.white60,
    textAlign: 'center',
    lineHeight: 18,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.neonTeal,
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ffffff12',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.white,
    fontSize: 13,
  },
  messageInput: {
    minHeight: 120,
    paddingTop: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.white,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
    gap: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: COLORS.darkLight,
    borderWidth: 1,
    borderColor: '#ffffff08',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.neonTeal,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 12,
    color: COLORS.white60,
    lineHeight: 16,
  },
  appInfo: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
  },
  appVersion: {
    fontSize: 11,
    color: COLORS.white40,
    fontWeight: '600',
  },
  appCopyright: {
    fontSize: 11,
    color: COLORS.white40,
  },
  appTagline: {
    fontSize: 12,
    color: COLORS.neonRed,
    fontWeight: '700',
    marginTop: 4,
  },
});
