import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateLicense } from './license';
import { router } from 'expo-router';

export interface LicenseStatus {
  isValid: boolean;
  isExpired: boolean;
  isDeleted: boolean;
  remainingDays: number;
  shouldLogout: boolean;
}

// Lisans durumunu kontrol et ve gerekirse logout yap
export async function checkLicenseAndLogout(): Promise<LicenseStatus> {
  try {
    console.log('🔍 Lisans durumu kontrol ediliyor...');
    
    // AsyncStorage'dan lisans anahtarını al
    const licenseKey = await AsyncStorage.getItem('vpn_license');
    
    if (!licenseKey) {
      console.log('❌ Lisans anahtarı bulunamadı, logout gerekli');
      await handleLogout();
      return {
        isValid: false,
        isExpired: false,
        isDeleted: true,
        remainingDays: 0,
        shouldLogout: true
      };
    }

    console.log('🔑 Lisans anahtarı bulundu, doğrulanıyor:', licenseKey);
    
    // Lisansı backend'den doğrula
    const result = await validateLicense(licenseKey);
    console.log('📊 Lisans doğrulama sonucu:', result);

    // Lisans geçersiz veya silinmiş
    if (result.status === 'invalid') {
      console.log('🚫 Lisans geçersiz/silinmiş, logout yapılıyor');
      await handleLogout();
      return {
        isValid: false,
        isExpired: false,
        isDeleted: true,
        remainingDays: 0,
        shouldLogout: true
      };
    }

    // Lisans süresi dolmuş
    if (result.status === 'error' && result.remainingDays && result.remainingDays <= 0) {
      console.log('⏰ Lisans süresi dolmuş, logout yapılıyor');
      await handleLogout();
      return {
        isValid: false,
        isExpired: true,
        isDeleted: false,
        remainingDays: 0,
        shouldLogout: true
      };
    }

    // Lisans geçerli
    if (result.status === 'valid') {
      console.log('✅ Lisans geçerli, kalan gün:', result.remainingDays);
      
      // Kalan günleri güncelle
      if (result.remainingDays) {
        await AsyncStorage.setItem('vpn_expiry', result.remainingDays.toString());
      }
      
      return {
        isValid: true,
        isExpired: false,
        isDeleted: false,
        remainingDays: result.remainingDays || 0,
        shouldLogout: false
      };
    }

    // Diğer durumlar
    console.log('⚠️ Belirsiz lisans durumu, güvenli tarafta kalarak logout');
    await handleLogout();
    return {
      isValid: false,
      isExpired: false,
      isDeleted: false,
      remainingDays: 0,
      shouldLogout: true
    };

  } catch (error) {
    console.error('💥 Lisans kontrol hatası:', error);
    // Hata durumunda logout yapmayalım, network problemi olabilir
    return {
      isValid: false,
      isExpired: false,
      isDeleted: false,
      remainingDays: 0,
      shouldLogout: false
    };
  }
}

// Logout işlemi
async function handleLogout() {
  try {
    console.log('🚪 Otomatik logout başlatılıyor...');
    
    // Tüm VPN verilerini temizle
    await AsyncStorage.multiRemove([
      'vpn_license',
      'vpn_servers', 
      'vpn_expiry',
      'vpn_selected_server'
    ]);
    
    console.log('🧹 VPN verileri temizlendi');
    
    // Lisans sayfasına yönlendir
    router.replace('/license');
    
    console.log('🔄 Lisans sayfasına yönlendirildi');
    
  } catch (error) {
    console.error('💥 Logout hatası:', error);
  }
}

// Otomatik lisans kontrolü hook'u (belirli aralıklarla kontrol)
export function startLicenseMonitoring(intervalMinutes: number = 5) {
  console.log(`⏰ Lisans izleme başlatıldı: ${intervalMinutes} dakika aralıklarla`);
  
  return setInterval(async () => {
    console.log('🔄 Periyodik lisans kontrolü yapılıyor...');
    await checkLicenseAndLogout();
  }, intervalMinutes * 60 * 1000);
}

// Sayfa odaklandığında lisans kontrolü
export async function checkLicenseOnFocus() {
  console.log('👁️ Sayfa odaklandı, lisans kontrol ediliyor...');
  return await checkLicenseAndLogout();
}
