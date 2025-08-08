import { Button } from '@/components/Button';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { RegistrationService } from '@/lib/registrationService';
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
      Alert.alert('Error', 'Password dan konfirmasi password tidak sama');
      return;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting registration process...');
      console.log('Form data:', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      });

      // Use RegistrationService with multiple fallback approaches
      const result = await RegistrationService.registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        password: formData.password,
      });

      console.log('Registration successful:', result);
      Alert.alert('Sukses', 'Registrasi berhasil! Silakan login.', [
        { text: 'OK', onPress: onSuccess }
      ]);

    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat registrasi';
      Alert.alert('Registrasi Gagal', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Button
            title="← Kembali"
            onPress={onBack}
            variant="outline"
            size="small"
          />
          <Text style={[styles.title, { color: colors.text }]}>Daftar Akun</Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text }]}>Nama Lengkap</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Masukkan nama lengkap"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            placeholder="Masukkan email"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.text }]}>Nomor HP</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            placeholder="Masukkan nomor HP"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />

          <Text style={[styles.label, { color: colors.text }]}>Alamat</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={formData.address}
            onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
            placeholder="Masukkan alamat lengkap"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
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

          <Text style={[styles.label, { color: colors.text }]}>Konfirmasi Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
            placeholder="Masukkan ulang password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
          />

          <Button
            title={loading ? "Mendaftar..." : "Daftar"}
            onPress={handleRegister}
            variant="primary"
            size="large"
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
  scrollContent: {
    flexGrow: 1,
    padding: Theme.spacing.lg,
  },
  header: {
    marginBottom: Theme.spacing.xl,
  },
  title: {
    fontSize: Theme.typography.fontSize.xxl,
    fontFamily: Theme.typography.fontFamily.bold,
    textAlign: 'center',
    marginTop: Theme.spacing.md,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});
