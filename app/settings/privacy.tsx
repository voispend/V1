import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Voispend Privacy Policy</Text>
      <Text style={styles.p}>
        This app stores your data locally on your device using AsyncStorage. Your audio recordings
        are used only to transcribe your expense description. Transcriptions may be sent to
        OpenAI's API to convert speech to text and to extract expense details. No account-level
        identifiers or analytics are sent to third parties. We do not sell your data.
      </Text>
      <Text style={styles.subTitle}>What we store</Text>
      <Text style={styles.p}>- Expenses you add (amount, currency, category, description, date)</Text>
      <Text style={styles.p}>- App preferences (theme, language)</Text>
      <Text style={styles.p}>- Temporary audio files during transcription (deleted after upload)</Text>
      <Text style={styles.subTitle}>Your controls</Text>
      <Text style={styles.p}>- You can delete expenses at any time in the app</Text>
      <Text style={styles.p}>- You can clear all local data by reinstalling the app</Text>
      <Text style={styles.subTitle}>Third-party services</Text>
      <Text style={styles.p}>
        Speech-to-text is powered by OpenAI. Voice clips are uploaded via encrypted connection.
        Refer to OpenAI's privacy policy for details on data retention and security.
      </Text>
      <Text style={styles.subTitle}>Contact</Text>
      <Text style={styles.p}>For questions: support@voispend.app</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 12 },
  p: { color: '#374151', lineHeight: 20 },
});


