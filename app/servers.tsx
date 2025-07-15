import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
// import { Settings, Globe, Wifi, Signal, Clock, ArrowRight } from '../components/Icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Server = {
  id: string;
  country: string;
  name: string;
  speed: string;
  accessKey: string;
};

export default function ServersScreen() {
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiryDays, setExpiryDays] = useState<string>('');

  useEffect(() => {
    const loadServers = async () => {
      try {
        const serversJson = await AsyncStorage.getItem('vpn_servers');
        const expiry = await AsyncStorage.getItem('vpn_expiry');
        
        if (serversJson) {
          setServers(JSON.parse(serversJson));
        }
        
        if (expiry) {
          setExpiryDays(expiry);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading servers:', error);
        setLoading(false);
      }
    };

    loadServers();
  }, []);

  const handleServerSelect = async (server: Server) => {
    // Store the selected server
    await AsyncStorage.setItem('vpn_selected_server', JSON.stringify(server));
    
    // Navigate to the connection screen
    router.push('/connection');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const getSpeedIcon = (speed: string) => {
    switch(speed) {
      case 'high':
        return <Text style={{ fontSize: 16, color: '#10B981' }}>📶</Text>;
      case 'medium':
        return <Text style={{ fontSize: 16, color: '#F59E0B' }}>📶</Text>;
      case 'low':
        return <Text style={{ fontSize: 16, color: '#EF4444' }}>📶</Text>;
      default:
        return <Text style={{ fontSize: 16, color: '#64748B' }}>📶</Text>;
    }
  };

  const renderServerItem = ({ item }: { item: Server }) => (
    <TouchableOpacity 
      style={styles.serverItem}
      onPress={() => handleServerSelect(item)}
    >
      <View style={styles.serverInfo}>
        <View style={styles.serverCountry}>
          <Text style={{ fontSize: 20, color: '#3B82F6' }}>🌐</Text>
          <Text style={styles.serverCountryText}>{item.country}</Text>
        </View>
        <Text style={styles.serverName}>{item.name}</Text>
        
        <View style={styles.serverDetails}>
          <View style={styles.serverDetail}>
            {getSpeedIcon(item.speed)}
            <Text style={styles.serverDetailText}>
              {item.speed === 'high' ? 'Yüksek' : item.speed === 'medium' ? 'Orta' : 'Düşük'} Hız
            </Text>
          </View>
        </View>
      </View>
      <Text style={{ fontSize: 20, color: '#64748B' }}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sunucu Seç</Text>
        <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
          <Text style={{ fontSize: 24, color: '#1E3A8A' }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.licenseInfo}>
        <Text style={{ fontSize: 16, color: '#3B82F6' }}>🕐</Text>
        <Text style={styles.licenseInfoText}>
          Lisans {expiryDays} gün sonra sona eriyor
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : servers.length > 0 ? (
        <FlatList
          data={servers}
          renderItem={renderServerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.serverList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.noServersContainer}>
          <Text style={{ fontSize: 64, color: '#94A3B8' }}>📶</Text>
          <Text style={styles.noServersText}>Sunucu bulunamadı</Text>
          <Text style={styles.noServersSubtext}>
            Lütfen lisansınızı kontrol edin veya daha sonra tekrar deneyin
          </Text>
        </View>
      )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  settingsButton: {
    padding: 8,
  },
  licenseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  licenseInfoText: {
    marginLeft: 8,
    color: '#1E3A8A',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serverList: {
    padding: 16,
  },
  serverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serverInfo: {
    flex: 1,
  },
  serverCountry: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serverCountryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginLeft: 8,
  },
  serverName: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  serverDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serverDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  serverDetailText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  noServersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noServersText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A8A',
    marginTop: 16,
  },
  noServersSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
});