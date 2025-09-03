import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { transcribeAudio } from '../utils/openai';

// Keep this interface to fit existing props
export type TranscriptionResult = { text: string; confidence?: number };

type Props = {
  onTranscription: (r: TranscriptionResult) => void;
  onError: (e: string) => void;
  disabled?: boolean;
};

const MAX_MS = 60_000;

export default function VoiceRecorder({ onTranscription, onError, disabled }: Props) {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ms, setMs] = useState(0);

  const recRef = useRef<Audio.Recording | null>(null);
  const tickRef = useRef<NodeJS.Timeout | number | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  
  // Web-specific refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isRecording) { pulse.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 1.0, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start(); return () => loop.stop();
  }, [isRecording, pulse]);

  const ensurePerms = useCallback(async () => {
    try {
      console.log('Requesting microphone permissions...');
      
      if (Platform.OS === 'web') {
        // Web-specific permission handling
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          onError('Microphone access not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
          return false;
        }
        
        try {
          // Test for MediaRecorder support with multiple fallbacks
          let hasMediaRecorder = false;
          if (typeof window !== 'undefined' && window.MediaRecorder) {
            hasMediaRecorder = true;
          }
          
          if (!hasMediaRecorder) {
            // Try to detect if we're in a mobile browser
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent);
            
            if (isMobile) {
              onError('Audio recording not supported in this mobile browser. Please use Chrome or Safari on mobile.');
            } else {
              onError('Audio recording not supported in this browser. Please use Chrome, Firefox, or Safari.');
            }
            return false;
          }
          
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            } 
          });
          streamRef.current = stream;
          console.log('Microphone permission granted for web');
          return true;
        } catch (error) {
          console.error('Microphone permission denied:', error);
          
          // Check if it's a permission error
          const errorObj = error as any;
          if (errorObj.name === 'NotAllowedError') {
            onError('Microphone permission denied. Please allow microphone access in your browser settings and refresh the page.');
          } else if (errorObj.name === 'NotFoundError') {
            onError('No microphone found. Please connect a microphone and try again.');
          } else if (errorObj.name === 'NotSupportedError') {
            onError('Microphone not supported in this browser. Please use Chrome, Firefox, or Safari.');
          } else {
            onError('Failed to access microphone. Please check your browser permissions and try again.');
          }
          return false;
        }
      } else {
        // Mobile platforms
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') { 
          onError(t('microphonePermissionDenied') ?? 'Microphone permission denied. Please allow microphone access.'); 
          return false; 
        }
        return true;
      }
    } catch (error) {
      console.error('Permission error:', error);
      onError('Failed to request microphone permission');
      return false;
    }
  }, [onError, t]);

  const start = useCallback(async () => {
    if (disabled || isProcessing) return;
    try {
      const ok = await ensurePerms(); 
      if (!ok) return;

      console.log('Starting recording...');

      if (Platform.OS === 'web') {
        // Web-specific recording
        if (!streamRef.current) {
          onError('No microphone stream available');
          return;
        }

        // Check for MediaRecorder support with fallback
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              onError('Audio recording format not supported in this browser');
              return;
            }
          }
        }

        const mediaRecorder = new MediaRecorder(streamRef.current, {
          mimeType: mimeType
        });
        
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            console.log('Web recording completed, processing...');
            
            const result = await transcribeAudio(audioUrl);
            onTranscription({ text: result.text, confidence: result.confidence });
            setIsProcessing(false);
            setMs(0);
            
            // Clean up
            URL.revokeObjectURL(audioUrl);
          } catch (error) {
            console.error('Web recording processing error:', error);
            onError('Failed to process recording. Please try again.');
            setIsProcessing(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        setMs(0);
        
        // Timer for web recording
        tickRef.current = setInterval(() => {
          setMs(prev => {
            const newMs = prev + 100;
            if (newMs >= MAX_MS) {
              stop();
            }
            return newMs;
          });
        }, 100);
        
      } else {
        // Mobile platforms
        const audioMode = {
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        };

        await Audio.setAudioModeAsync(audioMode);

        const rec = new Audio.Recording();
        const recordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;

        console.log('Preparing to record with options:', recordingOptions);
        await rec.prepareToRecordAsync(recordingOptions);
        await rec.startAsync();
        recRef.current = rec;

        console.log('Recording started successfully');
        setIsRecording(true); 
        setMs(0);
        
        tickRef.current = setInterval(async () => {
          try {
            const s = await rec.getStatusAsync();
            if ('durationMillis' in s) {
              const d = s.durationMillis ?? 0; 
              setMs(d);
              if (d >= MAX_MS) stop();
            }
          } catch (error) {
            console.error('Status check error:', error);
          }
        }, 100);
      }
    } catch (e) {
      console.error('start rec error', e); 
      onError(t('microphoneAccessError') ?? 'Failed to access microphone. Please check your browser permissions and try again.');
    }
  }, [disabled, ensurePerms, isProcessing, t]);

  const stop = useCallback(async () => {
    try {
      console.log('Stopping recording...');
      setIsRecording(false); 
      setIsProcessing(true);
      
      if (tickRef.current) { 
        clearInterval(tickRef.current); 
        tickRef.current = null; 
      }
      
      if (Platform.OS === 'web') {
        // Web-specific stop
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        
        // Stop the stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      } else {
        // Mobile platforms
        const rec = recRef.current; 
        if (!rec) return;
        
        await rec.stopAndUnloadAsync();
        const uri = rec.getURI(); 
        recRef.current = null;
        
        await Audio.setAudioModeAsync({ 
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
        });
        
        if (!uri) {
          throw new Error('No recording URI received');
        }

        console.log('Recording URI:', uri);

        const result = await transcribeAudio(uri);
        onTranscription({ text: result.text, confidence: result.confidence });
        setIsProcessing(false); 
        setMs(0);
      }
    } catch (e) {
      console.error('stop rec error', e);
      onError(t('recordingStopError') ?? 'Failed to stop recording. Please try again.');
      setIsProcessing(false);
    }
  }, [onError, t, onTranscription]);

  const onPress = () => (isRecording ? stop() : start());
  const seconds = Math.floor(ms / 1000);

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <TouchableOpacity
          onPress={onPress}
          disabled={!!disabled || isProcessing}
          activeOpacity={0.9}
          style={[
            styles.btn,
            isRecording ? styles.btnRec : styles.btnIdle,
            (disabled || isProcessing) && styles.btnDisabled,
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : isRecording ? (
            <Ionicons name="mic-off" size={44} color="#fff" />
          ) : (
            <Ionicons name="mic" size={44} color="#fff" />
          )}
        </TouchableOpacity>
      </Animated.View>

      {isRecording && (
        <View style={styles.badge}><Text style={styles.badgeText}>{seconds}s</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { 
    alignItems: 'center', 
    marginVertical: 24,
    flex: 1,
    justifyContent: 'center',
  },
  btn: {
    width: 180, 
    height: 180, 
    borderRadius: 90,
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000', 
    shadowOpacity: 0.25, 
    shadowRadius: 20, 
    shadowOffset: { width: 0, height: 10 }, 
    elevation: 8,
  },
  btnIdle: { backgroundColor: '#10B981' },
  btnRec: { backgroundColor: '#EF4444' },
  btnDisabled: { opacity: 0.5 },
  badge: { 
    marginTop: 16, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#EF4444' 
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});