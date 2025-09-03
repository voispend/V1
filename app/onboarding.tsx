import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { storage } from '../src/utils/storage';

const { width } = Dimensions.get('window');

const onboardingSteps = [
  {
    icon: 'mic',
    title: 'Voice Recording',
    description: 'Simply speak your expenses and let AI do the rest. No typing required!',
    color: '#10B981',
    bgColor: '#ECFDF5'
  },
  {
    icon: 'sparkles',
    title: 'Smart Categorization', 
    description: 'AI automatically categorizes your expenses and extracts amounts, dates, and descriptions.',
    color: '#8B5CF6',
    bgColor: '#F3E8FF'
  },
  {
    icon: 'bar-chart',
    title: 'Insightful Reports',
    description: 'Get detailed analytics and beautiful charts to understand your spending patterns.',
    color: '#3B82F6',
    bgColor: '#EFF6FF'
  }
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      
      // Animate step change
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      await storage.setItem('onboarding-complete', 'true');
      router.replace('/login');
    }
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await storage.setItem('onboarding-complete', 'true');
    router.replace('/login');
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Skip Button */}
        <View style={styles.skipContainer}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  width: index === currentStep ? 32 : 8,
                  backgroundColor: index === currentStep ? '#10B981' : '#E5E7EB'
                }
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <Animated.View 
          style={[
            styles.stepContent,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })
              }]
            }
          ]}
        >
          {/* Icon */}
          {currentStepData && (
            <>
              <View style={[styles.iconContainer, { backgroundColor: currentStepData.bgColor }]}>
                <View style={[styles.iconCircle, { backgroundColor: currentStepData.color }]}>
                  <Ionicons name={currentStepData.icon as any} size={40} color="white" />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.stepTitle}>{currentStepData.title}</Text>

              {/* Description */}
              <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            </>
          )}
        </Animated.View>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: currentStepData?.color || '#10B981' }]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Voispend Branding */}
        <View style={styles.brandingContainer}>
          <View style={styles.brandingLogo}>
            <Ionicons name="mic" size={16} color="white" />
          </View>
          <Text style={styles.brandingText}>Voispend</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  skipContainer: {
    alignItems: 'flex-end',
    paddingTop: 16,
    paddingBottom: 32,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 64,
    gap: 8,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
  },
  navigationContainer: {
    paddingBottom: 48,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  brandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  brandingLogo: {
    width: 24,
    height: 24,
    backgroundColor: '#10B981',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
});