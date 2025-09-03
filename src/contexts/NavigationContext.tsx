import React, { createContext, useContext, useState } from 'react';

interface NavigationContextType {
  currentScreen: string;
  currentParams: any;
  navigateTo: (screen: string, params?: any) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentParams, setCurrentParams] = useState<any>({});
  const [screenHistory, setScreenHistory] = useState<Array<{ screen: string; params: any }>>([{ screen: 'home', params: {} }]);

  const navigateTo = (screen: string, params?: any) => {
    console.log('🔍 NavigationContext navigateTo:', { 
      screen, 
      params, 
      currentScreen, 
      currentParams,
      willUpdate: currentScreen !== screen || JSON.stringify(currentParams) !== JSON.stringify(params)
    });
    
    if (currentScreen !== screen || JSON.stringify(currentParams) !== JSON.stringify(params)) {
      console.log('✅ Setting new navigation state:', { screen, params });
      setScreenHistory(prev => [...prev, { screen, params: params || {} }]);
      setCurrentScreen(screen);
      setCurrentParams(params || {});
    } else {
      console.log('⏭️ Navigation skipped - same screen and params');
    }
  };

  const goBack = () => {
    if (screenHistory.length > 1) {
      const newHistory = screenHistory.slice(0, -1);
      const previousScreen = newHistory[newHistory.length - 1];
      if (previousScreen) {
        setScreenHistory(newHistory);
        setCurrentScreen(previousScreen.screen);
        setCurrentParams(previousScreen.params);
      }
    }
  };

  return (
    <NavigationContext.Provider value={{ currentScreen, currentParams, navigateTo, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
};
