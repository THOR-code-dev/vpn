import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateLicense } from '../api/licenseAPI';

export default function LicenseScreen() {
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBack = () => {
    router.back();
  };

  const handlePurchase = () => {
    router.push('/purchase');
  };

  const handleSubmit = async () => {
    if (!licenseKey.trim()) {
      setError('Lütfen bir lisans anahtarı girin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await validateLicense(licenseKey);
      
      if (response.status === 'valid') {
        // Store the license key and available servers
        await AsyncStorage.setItem('vpn_license', licenseKey);
        await AsyncStorage.setItem('vpn_servers', JSON.stringify(response.available_servers));
        await AsyncStorage.setItem('vpn_expiry', response.remaining_days.toString());
        
        // Navigate to the servers screen
        router.replace('/servers');
      } else {
        setError('Geçersiz lisans anahtarı. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('License validation error:', error);
      setError('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={{ fontSize: 24, color: '#3B82F6' }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lisans Anahtarı</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={{ fontSize: 80, color: '#3B82F6' }}>🛡️</Text>
          <Text style={styles.logoText}>SecureVPN</Text>
        </View>
        
        <Text style={styles.description}>
          Lisans anahtarınızı girin ve VPN hizmetimize erişim sağlayın
        </Text>
        
        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Lisans Anahtarı</Text>
          <TextInput
            style={styles.input}
            value={licenseKey}
            onChangeText={setLicenseKey}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          
          <TouchableOpacity
            style={[styles.button, { opacity: licenseKey.trim() ? 1 : 0.5 }]}
            onPress={handleSubmit}
            disabled={!licenseKey.trim()}
          >
            <Text style={styles.buttonText}>Lisansı Doğrula</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.purchaseButton}
            onPress={handlePurchase}
          >
            <Text style={styles.purchaseButtonText}>Lisans satın al</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  logoContainer: {
    marginVertical: 24,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  purchaseButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});