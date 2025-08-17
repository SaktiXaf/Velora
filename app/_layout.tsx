import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import AuthNavigator from '../components/AuthNavigator';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <AuthNavigator>
            <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen 
                name="(tabs)" 
                options={{ 
                  headerShown: false 
                }} 
              />
              <Stack.Screen 
                name="auth" 
                options={{ 
                  headerShown: false 
                }} 
              />
              <Stack.Screen 
                name="login" 
                options={{ 
                  headerShown: false 
                }} 
              />
              <Stack.Screen 
                name="register" 
                options={{ 
                  headerShown: false 
                }} 
              />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </NavigationThemeProvider>
        </AuthNavigator>
      </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
