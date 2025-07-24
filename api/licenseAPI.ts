import { getApiUrl, API_ENDPOINTS } from '../src/config/api';

export interface LicenseValidationResponse {
  status: 'valid' | 'invalid' | 'error';
  message?: string;
  user?: string;
  remainingDays?: number;
  servers?: any[];
}

export interface CheckoutSessionResponse {
  sessionId: string;
}

export const validateLicense = async (licenseKey: string): Promise<LicenseValidationResponse> => {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.validateLicense), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        status: 'invalid',
        message: errorData.message || 'License validation failed'
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('License validation error:', error);
    return {
      status: 'error',
      message: 'Network error occurred'
    };
  }
};

export const createCheckoutSession = async (): Promise<CheckoutSessionResponse | null> => {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.createCheckoutSession), {
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
    console.error('Checkout session creation error:', error);
    return null;
  }
};