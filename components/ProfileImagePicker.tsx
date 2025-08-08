import { Theme } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ProfileImagePickerProps {
  value: string | null;
  onChange: (uri: string | null) => void;
  size?: number;
}

export const ProfileImagePicker = ({ 
  value, 
  onChange, 
  size = 100 
}: ProfileImagePickerProps) => {
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        onChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image. Please try again.');
    }
  };

  return (
    <TouchableOpacity onPress={handlePickImage}>
      {value ? (
        <Image
          source={{ uri: value }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Ionicons name="camera" size={size / 3} color={Theme.colors.white} />
        </View>
      )}
      <View style={styles.editBadge}>
        <Ionicons name="pencil" size={16} color={Theme.colors.white} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: Theme.colors.border,
  },
  placeholder: {
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: Theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.white,
  },
});
