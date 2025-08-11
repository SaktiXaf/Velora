import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  colors: {
    background: string;
    surface: string;
    white: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow: string;
    error: string;
    success: string;
    warning: string;
  };
}

const lightColors = {
  background: '#f8f9fa',
  surface: '#ffffff',
  white: '#ffffff',
  primary: '#007bff',
  secondary: '#6c757d',
  accent: '#17a2b8',
  text: '#212529',
  textSecondary: '#6c757d',
  border: '#dee2e6',
  shadow: '#000000',
  error: '#dc3545',
  success: '#28a745',
  warning: '#ffc107',
};

const darkColors = {
  background: '#121212',
  surface: '#1e1e1e',
  white: '#1e1e1e',
  primary: '#4dabf7',
  secondary: '#adb5bd',
  accent: '#22d3ee',
  text: '#ffffff',
  textSecondary: '#adb5bd',
  border: '#495057',
  shadow: '#000000',
  error: '#f87171',
  success: '#4ade80',
  warning: '#fbbf24',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(systemColorScheme || 'light');

  useEffect(() => {
    loadTheme();
  }, []);

  // Update theme when system theme changes
  useEffect(() => {
    console.log('🎨 System color scheme changed to:', systemColorScheme);
    if (systemColorScheme) {
      setMode(systemColorScheme);
    }
  }, [systemColorScheme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setMode(savedTheme);
      } else {
        // Use system theme as default
        setMode(systemColorScheme || 'light');
      }
    } catch (error) {
      console.log('Error loading theme:', error);
      setMode(systemColorScheme || 'light');
    }
  };

  const toggleTheme = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    try {
      await AsyncStorage.setItem('theme', newMode);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const colors = mode === 'light' ? lightColors : darkColors;

  console.log('🎨 ThemeProvider current state:', { mode, systemColorScheme });

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
