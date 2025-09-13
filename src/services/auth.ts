import { API_URL } from '../config/api';

export async function loginAdmin(username: string, password: string): Promise<boolean> {
  try {
    console.log('🚀 loginAdmin called with:', { username, password: password ? '***' : 'empty' });
    console.log('🌐 API_URL:', API_URL);
    
    const url = `${API_URL}/admin/login`;
    console.log('🔗 Request URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    console.log('📦 Response status:', response.status);
    console.log('📦 Response ok:', response.ok);

    if (!response.ok) {
      console.log('❌ Response not ok');
      return false;
    }

    const data = await response.json();
    console.log('📊 Response data:', data);
    
    // If we get a token, login was successful
    const success = data.token ? true : false;
    console.log('✅ Login success:', success);
    return success;
  } catch (error) {
    console.error('💥 Admin login error:', error);
    return false;
  }
}

