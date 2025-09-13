import { API_URL } from '../config/api';

export interface LicenseValidationResult {
  status: 'valid' | 'invalid' | 'error';
  remainingDays?: number;
  servers?: any[];
}

export async function validateLicense(key: string): Promise<LicenseValidationResult> {
  try {
    const response = await fetch(`${API_URL}/validate-license`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey: key }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        status: 'invalid',
      };
    }

    const data = await response.json();
    
    return {
      status: data.status,
      remainingDays: data.remainingDays,
      servers: data.servers,
    };
  } catch (error) {
    console.error('License validation error:', error);
    return { status: 'error' };
  }
}
