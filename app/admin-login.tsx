import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginAdmin } from '../src/services/auth';

export default function AdminLoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    console.log('🔐 Admin login attempt:', { username, password: password ? '***' : 'empty' });
    
    if (!username || !password) {
      console.log('❌ Validation failed: missing username or password');
      Alert.alert('Hata', 'Kullanıcı adı ve şifre gerekli');
      return;
    }

    setLoading(true);
    console.log('⏳ Setting loading state to true');
    
    try {
      console.log('📞 Calling loginAdmin function...');
      const success = await loginAdmin(username, password);
      console.log('📞 loginAdmin result:', success);
      
      if (success) {
        console.log('✅ Login successful, saving to AsyncStorage and redirecting');
        await AsyncStorage.setItem('admin_logged_in', 'true');
        router.replace('/admin');
      } else {
        console.log('❌ Login failed');
        Alert.alert('Hata', 'Giriş başarısız');
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      Alert.alert('Hata', 'Giriş işlemi sırasında hata oluştu');
    } finally {
      console.log('✅ Setting loading state to false');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Girişi</Text>
      <TextInput
        style={styles.input}
        placeholder="Kullanıcı adı"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 