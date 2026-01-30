import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, fonts } from '../theme';

export default function ScanScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  
  useEffect(() => {
    requestPermissions();
  }, []);
  
  const requestPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };
  
  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const photo = await cameraRef.current.takePictureAsync();
      Alert.alert('Foto aufgenommen', 'Dokument wird verarbeitet...');
      setCameraActive(false);
      // TODO: Process and upload photo
    } catch (error) {
      Alert.alert('Fehler', 'Foto konnte nicht aufgenommen werden');
    }
  };
  
  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    
    if (!result.canceled) {
      Alert.alert('Bild ausgewählt', 'Dokument wird verarbeitet...');
      // TODO: Process and upload image
    }
  };
  
  const pickDocument = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'text/*'],
      copyToCacheDirectory: true,
    });
    
    if (!result.canceled) {
      Alert.alert('Dokument ausgewählt', `${result.assets[0].name} wird verarbeitet...`);
      // TODO: Process and upload document
    }
  };
  
  if (cameraActive && hasPermission) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={cameraRef}>
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame} />
          </View>
          
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCameraActive(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <Ionicons name="images" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.darkBg : colors.light }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.orange + '15' }]}>
          <Ionicons name="scan" size={64} color={colors.orange} />
        </View>
        
        <Text style={[styles.title, { color: isDark ? colors.darkText : colors.dark }]}>
          Dokument hinzufügen
        </Text>
        <Text style={[styles.subtitle, { color: colors.midGray }]}>
          Scanne oder wähle ein Dokument aus, um es in deinem Vault zu speichern
        </Text>
        
        <View style={styles.options}>
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: isDark ? colors.darkCard : '#fff' }]}
            onPress={() => hasPermission ? setCameraActive(true) : requestPermissions()}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.orange + '15' }]}>
              <Ionicons name="camera" size={28} color={colors.orange} />
            </View>
            <Text style={[styles.optionTitle, { color: isDark ? colors.darkText : colors.dark }]}>
              Kamera
            </Text>
            <Text style={[styles.optionDesc, { color: colors.midGray }]}>
              Dokument fotografieren
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: isDark ? colors.darkCard : '#fff' }]}
            onPress={pickImage}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.info + '15' }]}>
              <Ionicons name="images" size={28} color={colors.info} />
            </View>
            <Text style={[styles.optionTitle, { color: isDark ? colors.darkText : colors.dark }]}>
              Galerie
            </Text>
            <Text style={[styles.optionDesc, { color: colors.midGray }]}>
              Aus Fotos auswählen
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: isDark ? colors.darkCard : '#fff' }]}
            onPress={pickDocument}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="document" size={28} color={colors.success} />
            </View>
            <Text style={[styles.optionTitle, { color: isDark ? colors.darkText : colors.dark }]}>
              Dateien
            </Text>
            <Text style={[styles.optionDesc, { color: colors.midGray }]}>
              PDF oder andere Dateien
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  options: {
    width: '100%',
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '600',
    marginLeft: spacing.md,
  },
  optionDesc: {
    fontSize: fonts.sizes.sm,
    marginLeft: spacing.md,
    flex: 1,
    textAlign: 'right',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 380,
    borderWidth: 2,
    borderColor: colors.orange,
    borderRadius: borderRadius.lg,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: '#fff',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
