import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, Animated, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/contexts/AuthContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useSupabase } from '../src/hooks/useSupabase';

export default function LoginScreen() {
  const { signIn, signUp, /* signInWithPhone, verifyOtp, */ loading } = useAuth();
  const { resetPassword } = useSupabase();
  const { t } = useLanguage();
  
  const [email, setEmail] = useState('');
  // const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  // const [isPhoneAuth, setIsPhoneAuth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  // const [otpSent, setOtpSent] = useState(false);
  // const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('rememberedEmail');
      const savedPassword = await AsyncStorage.getItem('rememberedPassword');
      if (savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const saveCredentials = async () => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedEmail', email);
        await AsyncStorage.setItem('rememberedPassword', password);
      } else {
        await AsyncStorage.removeItem('rememberedEmail');
        await AsyncStorage.removeItem('rememberedPassword');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  const clearForm = () => {
    setEmail('');
    // setPhoneNumber('');
    setPassword('');
    setFullName('');
    setErrorMessage('');
    setShowForgotPassword(false);
    setVerificationSent(false);
    // setOtpSent(false);
    // setOtp('');
  };

  const handleSubmit = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setErrorMessage('');
    
    // Phone authentication flow - COMMENTED OUT FOR LATER USE
    /*
    if (isPhoneAuth) {
      // Phone authentication flow
      if (!phoneNumber) {
        setErrorMessage('Please enter your phone number');
        return;
      }
      
      if (otpSent && !otp) {
        setErrorMessage('Please enter the OTP code');
        return;
      }
      
      if (!otpSent) {
        // Send OTP
        setIsSubmitting(true);
        try {
          console.log('🔐 Sending OTP to:', phoneNumber);
          const { error } = await signInWithPhone(phoneNumber);
          if (error) {
            console.error('❌ OTP send error:', error);
            setErrorMessage(`Failed to send OTP: ${error}`);
          } else {
            console.log('✅ OTP sent successfully');
            setOtpSent(true);
            setErrorMessage('OTP sent to your phone number');
          }
        } catch (err) {
          console.error('Phone auth error:', err);
          setErrorMessage('Failed to send OTP. Please try again.');
        } finally {
          setIsSubmitting(false);
        }
        return;
      }
      
              // Verify OTP
        if (otp && otp.length === 6) {
          setIsSubmitting(true);
          try {
            console.log('🔐 Verifying OTP for:', phoneNumber);
            const { error } = await verifyOtp(phoneNumber, otp);
            if (error) {
              console.error('❌ OTP verification error:', error);
              setErrorMessage(`OTP verification failed: ${error}`);
            } else {
              console.log('✅ OTP verified successfully');
              // Success - user is signed in
              router.replace('/');
            }
          } catch (err) {
            console.error('OTP verification error:', err);
            setErrorMessage('Failed to verify OTP. Please try again.');
          } finally {
            setIsSubmitting(false);
          }
        }
      return;
    }
    */
    
    // Email authentication flow
    if (!email || !password || (!isLogin && !fullName)) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (!isLogin && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMessage(error);
        } else {
          await saveCredentials();
          router.replace('/');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.includes('Email not confirmed')) {
            setVerificationSent(true);
            setErrorMessage('Please check your email and click the verification link to continue.');
          } else {
            setErrorMessage(error);
          }
        } else {
          setVerificationSent(true);
          setErrorMessage('Please check your email and click the verification link to continue.');
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address first');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        setErrorMessage(error.message || 'Failed to send reset email');
      } else {
        Alert.alert(
          'Password Reset Email Sent',
          'Please check your email for password reset instructions.',
          [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
        );
      }
    } catch (err) {
      setErrorMessage('Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLogin(!isLogin);
    clearForm();
  };

  // Phone authentication toggle - COMMENTED OUT FOR LATER USE
  /*
  const toggleAuthMethod = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPhoneAuth(!isPhoneAuth);
    clearForm();
  };
  */

  if (verificationSent) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.verificationContainer}>
            <View style={styles.logoImageContainer}>
              {/* Once voispend-logo.png is added to assets folder, this will work */}
              <Image 
                source={require('../assets/voispend-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.verificationTitle}>Check Your Email</Text>
            <Text style={styles.verificationMessage}>
              We've sent a verification link to:
            </Text>
            <Text style={styles.verificationEmail}>{email}</Text>
            <Text style={styles.verificationInstructions}>
              Please click the link in your email to verify your account and start using Voispend.
            </Text>
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => {
                setVerificationSent(false);
                clearForm();
              }}
            >
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Logo */}
            <View style={styles.logoSection}>
              <View style={styles.logoImageContainer}>
                {/* Once voispend-logo.png is added to assets folder, this will work */}
                <Image 
                  source={require('../assets/voispend-logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Forgot Password Form */}
            {showForgotPassword ? (
              <View style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPasswordTitle}>Reset Password</Text>
                <Text style={styles.forgotPasswordMessage}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                  onPress={handleForgotPassword}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backToLoginLink}
                  onPress={() => setShowForgotPassword(false)}
                >
                  <Text style={styles.backToLoginText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Toggle Login/Register */}
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[styles.toggleButton, isLogin && styles.activeToggle]}
                    onPress={() => setIsLogin(true)}
                  >
                    <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>
                      Sign In
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleButton, !isLogin && styles.activeToggle]}
                    onPress={toggleMode}
                  >
                    <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Authentication Method Toggle - COMMENTED OUT FOR LATER USE */}
                {/*
                <View style={styles.authMethodToggleContainer}>
                  <TouchableOpacity
                    style={[styles.authMethodToggleButton, !isPhoneAuth && styles.activeAuthMethodToggle]}
                    onPress={() => toggleAuthMethod()}
                  >
                    <Text style={[styles.authMethodToggleText, !isPhoneAuth && styles.activeAuthMethodToggleText]}>
                      Email
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.authMethodToggleButton, isPhoneAuth && styles.activeAuthMethodToggle]}
                    onPress={() => toggleAuthMethod()}
                  >
                    <Text style={[styles.authMethodToggleText, isPhoneAuth && styles.activeAuthMethodToggleText]}>
                      Phone
                    </Text>
                                     </TouchableOpacity>
                </View>
                */}

                {/* Form */}
                <View style={styles.form}>
                  {/* Full Name (Register only) */}
                  {!isLogin && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Full Name</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="person" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          value={fullName}
                          onChangeText={setFullName}
                          placeholder="Enter your full name"
                          autoCapitalize="words"
                        />
                      </View>
                    </View>
                  )}

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Phone Number Input - COMMENTED OUT FOR LATER USE */}
                  {/*
                  ) : (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Phone Number</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="call" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          value={phoneNumber}
                          onChangeText={setPhoneNumber}
                          placeholder="Enter your phone number"
                          keyboardType="phone-pad"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>
                  )}
                  */}

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        style={styles.passwordToggle}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-off" : "eye"} 
                          size={20} 
                          color="#9CA3AF" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* OTP Input for Phone Authentication - COMMENTED OUT FOR LATER USE */}
                  {/*
                  {isPhoneAuth && otpSent && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>OTP Code</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="key" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          value={otp}
                          onChangeText={setOtp}
                          placeholder="Enter 6-digit OTP"
                          keyboardType="number-pad"
                          maxLength={6}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>
                  )}
                  */}

                  {/* Remember Me & Forgot Password */}
                  {isLogin && (
                    <View style={styles.loginOptions}>
                      <TouchableOpacity
                        style={styles.rememberMeContainer}
                        onPress={() => setRememberMe(!rememberMe)}
                      >
                        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                          {rememberMe && <Ionicons name="checkmark" size={16} color="white" />}
                        </View>
                        <Text style={styles.rememberMeText}>Remember me</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.forgotPasswordLink}
                        onPress={() => setShowForgotPassword(true)}
                      >
                        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.submitButton, (isSubmitting || loading) && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={isSubmitting || loading}
                  >
                    <Text style={styles.submitButtonText}>
                      {isSubmitting 
                        ? (isLogin ? 'Signing In...' : 'Creating Account...')
                        : (isLogin ? 'Sign In' : 'Create Account')
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#10B981', // Voispend green
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoImageContainer: {
    width: 180,
    height: 180,
    backgroundColor: 'transparent',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 4,
    marginBottom: 32,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeToggle: {
    backgroundColor: '#10B981', // Voispend green
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeToggleText: {
    color: 'white',
  },
  authMethodToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  authMethodToggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeAuthMethodToggle: {
    backgroundColor: '#10B981', // Voispend green
  },
  authMethodToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeAuthMethodToggleText: {
    color: 'white',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  passwordToggle: {
    padding: 4,
  },
  loginOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#10B981', // Voispend green
    borderColor: '#10B981',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  forgotPasswordLink: {
    paddingVertical: 12,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#10B981', // Voispend green
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: '#10B981', // Voispend green
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
    marginLeft: 8,
  },
  verificationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  verificationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  verificationMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  verificationEmail: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  verificationInstructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  backToLoginButton: {
    backgroundColor: '#10B981', // Voispend green
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
  },
  backToLoginText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  forgotPasswordTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  forgotPasswordMessage: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  backToLoginLink: {
    alignItems: 'center',
    marginTop: 16,
  },
});