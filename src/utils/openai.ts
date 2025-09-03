// OpenAI utilities for React Native (Expo). Uses Supabase Edge Functions for receipt parsing.
// Environment variables should be set in Supabase for production deployment.

import { ENV } from '../config/env';
import { supabase } from '../config/supabase';

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language?: string;
}

export interface ExtractedExpenseData {
  amount: number;
  currency: string;
  description: string;
  category: string;
  date: string;
  confidence: number;
}

export interface ReceiptParseRequest {
  image_b64: string;
  locale_hint?: string;
  currency_hint?: string;
}

export interface ReceiptParseResponse {
  vendor?: string | null;
  date_iso?: string | null;
  currency?: string | null;
  amount: number;
  confidence: number;
  model?: string;
}

// Cache for expense extraction to avoid repeated API calls
const extractionCache: Record<string, ExtractedExpenseData> = {};

// Voice transcription via OpenAI Whisper API
export const transcribeAudio = async (audioUri: string): Promise<TranscriptionResult> => {
  try {
    console.log('Starting audio transcription for URI:', audioUri);
    
    if (!ENV.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    const form = new FormData();
    
    // Handle web blob URLs
    if (audioUri.startsWith('blob:')) {
      try {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        form.append('file', blob, 'recording.webm');
        form.append('model', 'whisper-1');
        form.append('response_format', 'json');
        console.log('Sending web blob to OpenAI Whisper...');
      } catch (error) {
        console.error('Error fetching blob:', error);
        throw new Error('Failed to process web audio recording');
      }
    } else {
      // Handle mobile file URIs
      let fileName = 'audio.m4a';
      let mimeType = 'audio/m4a';
      
      if (audioUri.includes('.webm')) {
        fileName = 'audio.webm';
        mimeType = 'audio/webm';
      } else if (audioUri.includes('.wav')) {
        fileName = 'audio.wav';
        mimeType = 'audio/wav';
      } else if (audioUri.includes('.mp3')) {
        fileName = 'audio.mp3';
        mimeType = 'audio/mp3';
      }
      
      // Pass RN file descriptor to Whisper
      form.append('file', {
        uri: audioUri,
        name: fileName,
        type: mimeType,
      } as any);
      form.append('model', 'whisper-1');
      form.append('response_format', 'json');
      console.log('Sending mobile file to OpenAI Whisper...');
    }
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENV.OPENAI_API_KEY}`,
      },
      body: form,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const text: string = data.text || '';
    
    console.log('Transcription successful:', text);
    
    return { text, confidence: 0.95 };
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

export const extractExpenseData = async (text: string): Promise<ExtractedExpenseData> => {
  if (extractionCache[text]) return extractionCache[text];

  const lower = text.toLowerCase();
  // Amount detection (supports "," or ".")
  const amountMatch = lower.match(/(?:\b|\$|€|£|₹)(\d{1,4}(?:[\.,]\d{1,2})?)/);
  const amount = amountMatch ? parseFloat((amountMatch[1] || '0').replace(',', '.')) : 0;

  // Currency detection (symbols and words)
  let currency = 'USD';
  if (/[€]|\beur\b|\beuro[s]?\b/.test(lower)) currency = 'EUR';
  else if (/[£]|\bgbp\b|\bpound[s]?\b/.test(lower)) currency = 'GBP';
  else if (/[₹]|\binr\b|\brupee[s]?\b|\brs\b/.test(lower)) currency = 'INR';
  else if (/[\$]|\busd\b|\bdollar[s]?\b/.test(lower)) currency = 'USD';
  else if (/\bcad\b|c\$|canadian\s+dollar[s]?/.test(lower)) currency = 'CAD';
  else if (/\baud\b|a\$|australian\s+dollar[s]?/.test(lower)) currency = 'AUD';
  else if (/[¥￥]|\bjpy\b|\byen\b/.test(lower)) currency = 'JPY';
  else if (/\bcny\b|\brenminbi\b|\byuan\b/.test(lower)) currency = 'CNY';

  // Keyword-based categorization
  const categoryKeywords: Record<string, string[]> = {
    Food: ['coffee', 'lunch', 'dinner', 'breakfast', 'meal', 'restaurant', 'pizza', 'burger', 'bar', 'starbucks', 'cafe'],
    Transport: ['uber', 'ola', 'taxi', 'bus', 'train', 'metro', 'fuel', 'gas', 'petrol', 'diesel', 'parking'],
    Shopping: ['shopping', 'store', 'bought', 'purchase', 'amazon', 'walmart', 'target'],
    Entertainment: ['movie', 'cinema', 'concert', 'game', 'netflix', 'spotify'],
    Utilities: ['internet', 'wifi', 'electric', 'electricity', 'water', 'phone', 'bill'],
    Health: ['doctor', 'pharmacy', 'medicine', 'hospital', 'gym', 'yoga'],
    Rent: ['rent', 'landlord', 'lease'],
    Misc: [],
  };

  let category = 'Misc';
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    const matches = keywords.reduce((acc, k) => acc + (lower.includes(k) ? 1 : 0), 0);
    if (matches > bestScore) {
      bestScore = matches;
      category = cat;
    }
  }

  const result: ExtractedExpenseData = {
    amount: amount > 0 ? amount : 0,
    currency,
    description: text.trim(),
    category,
    date: new Date().toISOString().split('T')[0] || new Date().toISOString().slice(0, 10) || '',
    confidence: bestScore > 0 ? 0.9 : 0.7,
  };
  extractionCache[text] = result;
  return result;
};

// Receipt parsing via Supabase Edge Function
export const parseReceipt = async (request: ReceiptParseRequest): Promise<ReceiptParseResponse> => {
  try {
    console.log('🔍 Starting receipt parsing via Supabase Edge Function...');
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('receipt-parse-public', {
      body: request
    });

    if (error) {
      console.error('❌ Supabase Edge Function error:', error);
      throw new Error(error.message || 'Failed to parse receipt');
    }

    console.log('✅ Receipt parsing successful:', data);
    return data as ReceiptParseResponse;

  } catch (error) {
    console.error('❌ Receipt parsing error:', error);
    throw error;
  }
};
