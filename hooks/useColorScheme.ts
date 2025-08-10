import { useColorScheme as useColorSchemeRN } from 'react-native';

export function useColorScheme() {
  const colorScheme = useColorSchemeRN();
  console.log('🎨 Color Scheme Detection:', colorScheme);
  return colorScheme;
}
