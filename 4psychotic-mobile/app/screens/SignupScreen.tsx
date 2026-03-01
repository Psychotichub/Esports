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
import { Mail, Lock, Eye, EyeOff, User, Gamepad2, Check } from 'lucide-react-native';
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

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    const success = await signup(name, email, password);
    setLoading(false);
    
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack(); // Go back to previous screen
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ email: 'Signup failed. Please try again.' });
    }
  };

  const handleLoginPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('login');
  };

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, text: '', color: COLORS.white40 };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) {
      return { strength, text: 'Weak', color: COLORS.error };
    } else if (strength <= 4) {
      return { strength, text: 'Medium', color: COLORS.neonTeal };
    } else {
      return { strength, text: 'Strong', color: COLORS.success };
    }
  };

  const passwordStrength = getPasswordStrength();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopNavBar title="Sign Up" />
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
                <Gamepad2 size={48} color={COLORS.neonTeal} strokeWidth={2} />
              </View>
              <Text style={styles.logoText}>Join 4PSYCHOTIC</Text>
              <Text style={styles.tagline}>Start your gaming journey</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <User size={20} color={COLORS.white60} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={COLORS.white40}
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (errors.name) {
                        setErrors({ ...errors, name: undefined });
                      }
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

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
                {password && (
                  <View style={styles.passwordStrengthContainer}>
                    <View style={styles.passwordStrengthBar}>
                      <View
                        style={[
                          styles.passwordStrengthFill,
                          {
                            width: `${(passwordStrength.strength / 6) * 100}%`,
                            backgroundColor: passwordStrength.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                      {passwordStrength.text}
                    </Text>
                  </View>
                )}
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color={COLORS.white60} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor={COLORS.white40}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) {
                        setErrors({ ...errors, confirmPassword: undefined });
                      }
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowConfirmPassword(!showConfirmPassword);
                    }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={COLORS.white60} />
                    ) : (
                      <Eye size={20} color={COLORS.white60} />
                    )}
                  </TouchableOpacity>
                </View>
                {confirmPassword && password === confirmPassword && (
                  <View style={styles.matchIndicator}>
                    <Check size={14} color={COLORS.success} />
                    <Text style={styles.matchText}>Passwords match</Text>
                  </View>
                )}
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.signupButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Signup Buttons */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Handle Google signup
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.socialButtonText}>Sign up with Google</Text>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={handleLoginPress}>
                  <Text style={styles.loginLink}>Login</Text>
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
  passwordStrengthContainer: ViewStyle;
  passwordStrengthBar: ViewStyle;
  passwordStrengthFill: ViewStyle;
  passwordStrengthText: TextStyle;
  matchIndicator: ViewStyle;
  matchText: TextStyle;
  signupButton: ViewStyle;
  signupButtonDisabled: ViewStyle;
  signupButtonText: TextStyle;
  divider: ViewStyle;
  dividerLine: ViewStyle;
  dividerText: TextStyle;
  socialButton: ViewStyle;
  socialButtonText: TextStyle;
  loginContainer: ViewStyle;
  loginText: TextStyle;
  loginLink: TextStyle;
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
    borderColor: COLORS.neonTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
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
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#ffffff08',
    borderRadius: 2,
    overflow: 'hidden',
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  matchText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: COLORS.neonTeal,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.neonTeal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.white60,
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.neonRed,
    fontWeight: '700',
  },
});
