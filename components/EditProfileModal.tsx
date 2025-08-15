import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ProfileUpdateData) => Promise<boolean>;
  currentData: {
    name: string;
    bio: string;
    age: number | null;
    avatar: string | null;
  };
}

export interface ProfileUpdateData {
  name: string;
  bio: string;
  age: number | undefined;
  avatar?: string | null;
}

export default function EditProfileModal({ 
  visible, 
  onClose, 
  onSave, 
  currentData 
}: EditProfileModalProps) {
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    name: currentData.name,
    bio: currentData.bio || '',
    age: currentData.age?.toString() || '',
    avatar: currentData.avatar
  });
  const [loading, setLoading] = useState(false);
  const [avatarChanged, setAvatarChanged] = useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (visible) {
      setFormData({
        name: currentData.name,
        bio: currentData.bio || '',
        age: currentData.age?.toString() || '',
        avatar: currentData.avatar
      });
      setAvatarChanged(false);
    }
  }, [visible, currentData]);

  const handleImagePicker = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera roll permissions to upload your profile picture.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, avatar: result.assets[0].uri }));
        setAvatarChanged(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera permissions to take your profile picture.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, avatar: result.assets[0].uri }));
        setAvatarChanged(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Camera', onPress: handleTakePhoto },
        { text: 'Photo Library', onPress: handleImagePicker },
        { text: 'Remove Photo', onPress: () => {
          setFormData(prev => ({ ...prev, avatar: null }));
          setAvatarChanged(true);
        }},
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    const ageNumber = formData.age.trim() ? parseInt(formData.age.trim()) : undefined;
    if (formData.age.trim() && (isNaN(ageNumber!) || ageNumber! < 1 || ageNumber! > 120)) {
      Alert.alert('Error', 'Please enter a valid age (1-120)');
      return;
    }

    setLoading(true);
    try {
      const updateData: ProfileUpdateData = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        age: ageNumber,
      };

      // Only include avatar if it was changed
      if (avatarChanged) {
        updateData.avatar = formData.avatar;
      }

      const success = await onSave(updateData);
      
      if (success) {
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: onClose }
        ]);
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <Text style={[styles.cancelButton, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
          
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.saveButton, { color: colors.primary }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity 
              style={styles.avatarContainer} 
              onPress={showImageOptions}
              disabled={loading}
            >
              {formData.avatar ? (
                <Image source={{ uri: formData.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarPlaceholderText, { color: colors.white }]}>
                    {formData.name.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              
              <View style={[styles.avatarOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <Ionicons name="camera" size={24} color="white" />
              </View>
            </TouchableOpacity>
            
            <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
              Tap to change profile picture
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
                editable={!loading}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput, { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={formData.bio}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                placeholder="Tell us about yourself..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Age</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={formData.age}
                onChangeText={(text) => setFormData(prev => ({ ...prev, age: text }))}
                placeholder="Enter your age"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 50,
  },
  bioInput: {
    minHeight: 100,
  },
});
