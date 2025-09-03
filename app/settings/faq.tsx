import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const QA = [
  { q: 'How do I record an expense?', a: 'Tap the Record button on Home, speak naturally, then review and save.' },
  { q: 'Can I edit a transcription?', a: 'Yes. On the review screen, edit fields before saving the expense.' },
  { q: 'What if transcription is wrong?', a: 'Tap Record Again to re-record, or adjust the fields manually.' },
  { q: 'Where is my data stored?', a: 'On your device via AsyncStorage. No cloud backend is enabled right now.' },
  { q: 'Does the app require an account?', a: 'Currently a local stub; sign-in stores a fake user locally.' },
];

export default function FAQScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {QA.map((item) => (
        <View key={item.q} style={styles.card}>
          <Text style={styles.q}>{item.q}</Text>
          <Text style={styles.a}>{item.a}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 12 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12 },
  q: { fontWeight: '800', color: '#111827', marginBottom: 6 },
  a: { color: '#374151', lineHeight: 20 },
});


