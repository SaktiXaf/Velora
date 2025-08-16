import { Button } from '@/components/Button';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { AuthService } from '@/lib/authService';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoginScreenProps {
  onBack: () => void;
  onSuccess: (user: any) => void;
}

export default function LoginScreen({ onBack, onSuccess }: LoginScreenProps) {
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    emailOrName: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!formData.emailOrName.trim()) {
      Alert.alert('Error', 'Email atau nama tidak boleh kosong');
      return;
    }
    if (!formData.password) {
      Alert.alert('Error', 'Password tidak boleh kosong');
      return;
    }

    setLoading(true);
    try {
      const data = await AuthService.loginUser(formData.emailOrName.trim(), formData.password);

      if (data.user) {
        onSuccess(data.user);
        return;
      } else {
        throw new Error('Login gagal. Silakan periksa email/password Anda.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login gagal';
      
      Alert.alert('Login Gagal', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Button
            title="← Kembali"
            onPress={onBack}
            variant="outline"
            size="small"
          />
          <Ionicons name="person-circle-outline" size={120} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Masuk ke Velora</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Silakan masuk dengan akun Anda</Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>Email atau Nama</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={formData.emailOrName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, emailOrName: text }))}
              placeholder="Masukkan email atau nama"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />

            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              placeholder="Masukkan password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
            />

            <Button
              title={loading ? "Masuk..." : "Masuk"}
              onPress={handleLogin}
              variant="primary"
              size="large"
              disabled={loading}
            />
          </View>
        </View>

        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Belum punya akun? Daftar untuk mulai tracking aktivitas
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Theme.spacing.lg,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  title: {
    fontSize: Theme.typography.fontSize.xxl,
    fontFamily: Theme.typography.fontFamily.bold,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.regular,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  formContainer: {
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    marginHorizontal: Theme.spacing.md,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: Theme.spacing.lg,
  },
  form: {
    gap: Theme.spacing.md,
  },
  label: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.medium,
    marginBottom: Theme.spacing.xs,
  },
  input: {
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.regular,
    borderWidth: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
});
