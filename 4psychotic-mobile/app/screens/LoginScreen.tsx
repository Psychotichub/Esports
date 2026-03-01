import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Mail, Lock, Eye, EyeOff, Gamepad2 } from 'lucide-react-native';
import TopNavBar from '../../components/TopNavBar';
import { useAuth } from '../../lib/authContext';

const COLORS = {
  dark: '#0a0e1a',
  darkLight: '#0f1420',
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
  error: '#ff006e',
  success: '#00ff88',
};

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack(); // Go back to previous screen
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ email: 'Invalid email or password' });
    }
  };

  const handleSignupPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('signup');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopNavBar title="Login" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo/Icon */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Gamepad2 size={48} color={COLORS.neonRed} strokeWidth={2} />
              </View>
              <Text style={styles.logoText}>4PSYCHOTIC</Text>
              <Text style={styles.tagline}>Welcome back, gamer</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color={COLORS.white60} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={COLORS.white40}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) {
                        setErrors({ ...errors, email: undefined });
                      }
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color={COLORS.white60} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={COLORS.white40}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) {
                        setErrors({ ...errors, password: undefined });
                      }
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowPassword(!showPassword);
                    }}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={COLORS.white60} />
                    ) : (
                      <Eye size={20} color={COLORS.white60} />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Navigate to forgot password screen
                }}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Handle Google login
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity onPress={handleSignupPress}>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  keyboardView: ViewStyle;
  scrollContent: ViewStyle;
  content: ViewStyle;
  logoContainer: ViewStyle;
  logoCircle: ViewStyle;
  logoText: TextStyle;
  tagline: TextStyle;
  form: ViewStyle;
  inputContainer: ViewStyle;
  inputWrapper: ViewStyle;
  inputIcon: ViewStyle;
  input: TextStyle;
  eyeIcon: ViewStyle;
  errorText: TextStyle;
  forgotPassword: ViewStyle;
  forgotPasswordText: TextStyle;
  loginButton: ViewStyle;
  loginButtonDisabled: ViewStyle;
  loginButtonText: TextStyle;
  divider: ViewStyle;
  dividerLine: ViewStyle;
  dividerText: TextStyle;
  socialButton: ViewStyle;
  socialButtonText: TextStyle;
  signupContainer: ViewStyle;
  signupText: TextStyle;
  signupLink: TextStyle;
}>({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 32,
  },
  logoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.darkLight,
    borderWidth: 2,
    borderColor: COLORS.neonRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.white60,
    fontWeight: '600',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkLight,
    borderWidth: 1,
    borderColor: '#ffffff08',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.neonTeal,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: COLORS.neonRed,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.neonRed,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ffffff08',
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.white40,
    fontWeight: '600',
  },
  socialButton: {
    backgroundColor: COLORS.darkLight,
    borderWidth: 1,
    borderColor: '#ffffff08',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signupText: {
    fontSize: 14,
    color: COLORS.white60,
  },
  signupLink: {
    fontSize: 14,
    color: COLORS.neonTeal,
    fontWeight: '700',
  },
});
