import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API URL
const API_BASE_URL = 'http://localhost:3000/api';

export const validateLicense = async (licenseKey: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/validate-license`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'License validation failed');
    }

    const data = await response.json();
    
    if (data.status === 'valid') {
      // Store license data
      await AsyncStorage.setItem('vpn_license', licenseKey);
      await AsyncStorage.setItem('vpn_servers', JSON.stringify(data.servers));
      await AsyncStorage.setItem('vpn_expiry', data.remainingDays.toString());
      
      return {
        status: 'valid',
        remaining_days: data.remainingDays,
        available_servers: data.servers,
      };
    } else {
      throw new Error(data.message || 'Invalid license');
    }
  } catch (error: any) {
    console.error('License validation error:', error);
    throw error;
  }
};

export const createLicense = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('License creation error:', error);
    throw error;
  }
};