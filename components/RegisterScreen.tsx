import { Button } from '@/components/Button';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { EnhancedRegistrationService } from '@/lib/enhancedRegistrationService';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RegisterScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function RegisterScreen({ onBack, onSuccess }: RegisterScreenProps) {
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validasi input
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Nama tidak boleh kosong');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email tidak boleh kosong');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Nomor HP tidak boleh kosong');
      return;
    }
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Alamat tidak boleh kosong');
      return;
    }
    if (!formData.password) {
      Alert.alert('Error', 'Password tidak boleh kosong');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Konfirmasi password tidak cocok');
      return;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Format email tidak valid');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Starting registration process...');
      console.log('📊 Form data:', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim()
      });

      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        password: formData.password
      };

      console.log('🚀 Calling enhanced registration service...');
      const result = await EnhancedRegistrationService.registerUser(userData);
      console.log('✅ Registration service result:', result);

      if (result.success) {
        Alert.alert('Sukses', 'Registrasi berhasil!', [
          { text: 'OK', onPress: onSuccess }
        ]);
      } else {
        // This shouldn't happen with EnhancedRegistrationService as it throws on failure
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      const errorMessage = error.message || 'Terjadi kesalahan saat registrasi';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Daftar Akun Baru</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Bergabung dengan komunitas lari
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Nama Lengkap</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Masukkan email"
              placeholderTextColor={colors.textSecondary}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Nomor HP</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Masukkan nomor HP"
              placeholderTextColor={colors.textSecondary}
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Alamat</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Masukkan alamat"
              placeholderTextColor={colors.textSecondary}
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
              multiline
              numberOfLines={2}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Masukkan password"
              placeholderTextColor={colors.textSecondary}
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Konfirmasi Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Konfirmasi password"
              placeholderTextColor={colors.textSecondary}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
              secureTextEntry
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? 'Mendaftar...' : 'Daftar'}
            onPress={handleRegister}
            disabled={loading}
          />
          
          <Button
            title="Kembali"
            onPress={onBack}
            variant="secondary"
            disabled={loading}
          />
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
    padding: Theme.spacing.lg,
  },
  header: {
    marginBottom: Theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: Theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    marginBottom: Theme.spacing.xl,
  },
  inputGroup: {
    marginBottom: Theme.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: 16,
    minHeight: 50,
  },
  buttonContainer: {
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
});
