import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';

type Language = 'en' | 'es' | 'fr' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translation dictionaries
const translations = {
  en: {
    // Navigation
    home: 'Home',
    record: 'Record',
    reports: 'Reports',
    settings: 'Settings',
    
    // Home Screen
    hello: 'Hello',
    trackExpenses: 'Voice your expenses with Voispend',
    totalSpent: 'Total Spent',
    tapToRecord: 'Tap to Record',
    voiceYourExpense: 'Voice your expense',
    recentExpenses: 'Recent Expenses',
    viewAll: 'View All',
    noExpensesYet: 'No expenses yet',
    startRecording: 'Start recording your first expense!',
    
    // Recording Screen
    voiceExpense: 'Voice Expense',
    tapToRecordExpense: 'Tap to record expense',
    recording: 'Recording... Tap to stop',
    tapWhenFinished: 'Tap the button again when finished',
    processingWithAI: 'Processing with AI...',
    usingOpenAI: 'Processing locally (stubbed)',
    transcription: 'Transcription',
    reviewAndEdit: 'Review & Edit',
    aiConfidence: 'AI Confidence',
    original: 'Original',
    amount: 'Amount',
    currency: 'Currency',
    description: 'Description',
    category: 'Category',
    date: 'Date',
    recordAgain: 'Record Again',
    saveExpense: 'Save Expense',
    
    // Auth
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    signIn: 'Sign In',
    createAccount: 'Create Account',
    
    // Common
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    microphonePermissionDenied: 'Microphone permission denied',
    microphoneAccessError: 'Failed to access microphone',
    recordingStopError: 'Failed to stop recording',
  },
  
  
  
  es: {
    // Navigation
    home: 'Inicio',
    record: 'Grabar',
    reports: 'Informes',
    settings: 'Configuración',
    
    // Home Screen
    hello: 'Hola',
    trackExpenses: 'Rastrea tus gastos con voz',
    totalSpent: 'Total Gastado',
    tapToRecord: 'Toca para Grabar',
    voiceYourExpense: 'Di tu gasto',
    recentExpenses: 'Gastos Recientes',
    viewAll: 'Ver Todo',
    noExpensesYet: 'Aún no hay gastos',
    startRecording: '¡Comienza a grabar tu primer gasto!',
    
    // Common
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    back: 'Atrás',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
  },
  
  fr: {
    // Navigation
    home: 'Accueil',
    record: 'Enregistrer',
    reports: 'Rapports',
    settings: 'Paramètres',
    
    // Home Screen
    hello: 'Bonjour',
    trackExpenses: 'Suivez vos dépenses avec la voix',
    totalSpent: 'Total Dépensé',
    tapToRecord: 'Appuyez pour Enregistrer',
    voiceYourExpense: 'Dites votre dépense',
    recentExpenses: 'Dépenses Récentes',
    viewAll: 'Voir Tout',
    noExpensesYet: 'Aucune dépense pour le moment',
    startRecording: 'Commencez à enregistrer votre première dépense!',
    
    // Common
    cancel: 'Annuler',
    save: 'Sauvegarder',
    delete: 'Supprimer',
    edit: 'Modifier',
    back: 'Retour',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
  },
  
  de: {
    // Navigation
    home: 'Startseite',
    record: 'Aufnehmen',
    reports: 'Berichte',
    settings: 'Einstellungen',
    
    // Home Screen
    hello: 'Hallo',
    trackExpenses: 'Verfolge deine Ausgaben mit der Stimme',
    totalSpent: 'Gesamtausgaben',
    tapToRecord: 'Zum Aufnehmen tippen',
    voiceYourExpense: 'Sag deine Ausgabe',
    recentExpenses: 'Letzte Ausgaben',
    viewAll: 'Alle anzeigen',
    noExpensesYet: 'Noch keine Ausgaben',
    startRecording: 'Starte deine erste Aufnahme!',
    
    // Recording Screen
    voiceExpense: 'Sprachausgabe',
    tapToRecordExpense: 'Zum Aufnehmen tippen',
    recording: 'Aufnahme... Zum Stoppen tippen',
    tapWhenFinished: 'Tippe erneut, wenn du fertig bist',
    processingWithAI: 'Wird mit KI verarbeitet...',
    transcription: 'Transkription',
    reviewAndEdit: 'Prüfen & Bearbeiten',
    aiConfidence: 'KI-Vertrauen',
    original: 'Original',
    amount: 'Betrag',
    currency: 'Währung',
    description: 'Beschreibung',
    category: 'Kategorie',
    date: 'Datum',
    recordAgain: 'Erneut aufnehmen',
    saveExpense: 'Ausgabe speichern',
    
    // Auth
    login: 'Anmelden',
    register: 'Registrieren',
    email: 'E-Mail',
    password: 'Passwort',
    fullName: 'Vollständiger Name',
    signIn: 'Anmelden',
    createAccount: 'Konto erstellen',
    
    // Common
    cancel: 'Abbrechen',
    save: 'Speichern',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    back: 'Zurück',
    loading: 'Laden...',
    error: 'Fehler',
    success: 'Erfolg',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await storage.getItem('app-language') as Language;
      if (saved) {
        setLanguageState(saved);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await storage.setItem('app-language', lang);
  };

  const t = (key: string): string => {
    const translation = translations[language] as Record<string, string>;
    return translation[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const languageOptions = [
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'de' as Language, name: 'Deutsch', flag: '🇩🇪' },
];