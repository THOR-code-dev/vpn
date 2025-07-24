import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal, Switch } from 'react-native';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, getApiUrl, API_ENDPOINTS } from '../src/config/api';

interface License {
  id: string;
  key: string;
  email: string;
  createdAt: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'suspended';
}

interface User {
  id: string;
  email: string;
  licenseKey: string;
  lastLogin: string;
  totalUsage: number;
  status: 'active' | 'inactive' | 'suspended';
  currentServer?: string;
}

interface Server {
  id: string;
  name: string;
  country: string;
  city: string;
  ip: string;
  port: number;
  status: 'online' | 'offline' | 'maintenance';
  users: number;
  maxUsers: number;
  bandwidth: number;
  isActive: boolean;
}

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<'licenses' | 'users' | 'servers'>('licenses');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    expiryDate: '',
    name: '',
    country: '',
    city: '',
    ip: '',
    port: '',
    licenseKey: '',
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('admin_token');
      if (!token) {
        router.replace('/admin-login');
        return;
      }
      // Token doğrulama
      try {
        const res = await fetch(getApiUrl(API_ENDPOINTS.adminVerify), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!data.valid) {
          await AsyncStorage.removeItem('admin_token');
          router.replace('/admin-login');
        }
      } catch {
        await AsyncStorage.removeItem('admin_token');
        router.replace('/admin-login');
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/${activeTab}`));
      const data = await response.json();
      
      if (activeTab === 'licenses') setLicenses(data);
      else if (activeTab === 'users') setUsers(data);
      else if (activeTab === 'servers') setServers(data);
    } catch (error) {
      Alert.alert('Hata', 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      email: '',
      expiryDate: '',
      name: '',
      country: '',
      city: '',
      ip: '',
      port: '',
      licenseKey: '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const url = getApiUrl(`/${activeTab}`);
      const method = editingItem ? 'PUT' : 'POST';
      const finalUrl = editingItem ? `${url}/${editingItem.id}` : url;
      
      const response = await fetch(finalUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        Alert.alert('Başarılı', editingItem ? 'Güncellendi' : 'Oluşturuldu');
        setModalVisible(false);
        loadData();
      } else {
        const errorData = await response.json();
        Alert.alert('Hata', errorData.error || 'Kaydedilirken hata oluştu');
      }
    } catch (error) {
      Alert.alert('Hata', 'Sunucuya ulaşılamadı');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Sil',
      'Bu öğeyi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(getApiUrl(`/${activeTab}/${id}`), {
                method: 'DELETE',
              });
              if (response.ok) {
                Alert.alert('Başarılı', 'Silindi');
                loadData();
              } else {
                const errorData = await response.json();
                Alert.alert('Hata', errorData.error || 'Silinirken hata oluştu');
              }
            } catch (error) {
              Alert.alert('Hata', 'Sunucuya ulaşılamadı');
            }
          },
        },
      ]
    );
  };

  const renderLicenseItem = ({ item }: { item: License }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.key}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.statusText}>{item.status === 'active' ? 'Aktif' : 'Süresi Dolmuş'}</Text>
        </View>
      </View>
      <Text style={styles.itemSubtitle}>{item.email}</Text>
      <Text style={styles.itemDate}>Bitiş: {new Date(item.expiryDate).toLocaleDateString('tr-TR')}</Text>
      <View style={styles.itemActions}>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => {
          setEditingItem(item);
          setFormData({ email: item.email, expiryDate: item.expiryDate.split('T')[0], name: '', country: '', city: '', ip: '', port: '', licenseKey: '' });
          setModalVisible(true);
        }}>
          <Text style={styles.actionButtonText}>Düzenle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item.id)}>
          <Text style={styles.actionButtonText}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.email}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#10B981' : '#6B7280' }]}>
          <Text style={styles.statusText}>{item.status === 'active' ? 'Aktif' : 'Pasif'}</Text>
        </View>
      </View>
      <Text style={styles.itemSubtitle}>Lisans: {item.licenseKey}</Text>
      <Text style={styles.itemDate}>Son Giriş: {new Date(item.lastLogin).toLocaleDateString('tr-TR')}</Text>
      <Text style={styles.itemUsage}>Kullanım: {(item.totalUsage / (1024 * 1024)).toFixed(2)} MB</Text>
      <View style={styles.itemActions}>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => {
          setEditingItem(item);
          setFormData({ 
            email: item.email, 
            licenseKey: item.licenseKey,
            name: '', 
            country: '', 
            city: '', 
            ip: '', 
            port: '', 
            expiryDate: '' 
          });
          setModalVisible(true);
        }}>
          <Text style={styles.actionButtonText}>Düzenle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item.id)}>
          <Text style={styles.actionButtonText}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderServerItem = ({ item }: { item: Server }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.name || 'İsimsiz Sunucu'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'online' ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.statusText}>{item.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}</Text>
        </View>
      </View>
      <Text style={styles.itemSubtitle}>{item.city || 'Bilinmeyen Şehir'}, {item.country || 'Bilinmeyen Ülke'}</Text>
      <Text style={styles.itemDate}>IP: {item.ip || 'N/A'}:{item.port || 'N/A'}</Text>
      <Text style={styles.itemUsage}>Kullanıcılar: {item.users || 0}/{item.maxUsers || 100}</Text>
      <View style={styles.itemActions}>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => {
          setEditingItem(item);
          setFormData({ 
            name: item.name || '', 
            country: item.country || '', 
            city: item.city || '', 
            ip: item.ip || '', 
            port: item.port ? item.port.toString() : '', 
            email: '', 
            expiryDate: '',
            licenseKey: ''
          });
          setModalVisible(true);
        }}>
          <Text style={styles.actionButtonText}>Düzenle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item.id)}>
          <Text style={styles.actionButtonText}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getCurrentData = () => {
    if (activeTab === 'licenses') return licenses;
    if (activeTab === 'users') return users;
    if (activeTab === 'servers') return servers;
    return [];
  };

  const getCurrentRenderer = () => {
    if (activeTab === 'licenses') return renderLicenseItem;
    if (activeTab === 'users') return renderUserItem;
    if (activeTab === 'servers') return renderServerItem;
    return renderLicenseItem;
  };

  const getTabTitle = () => {
    if (activeTab === 'licenses') return 'Lisans Yönetimi';
    if (activeTab === 'users') return 'Kullanıcı Yönetimi';
    if (activeTab === 'servers') return 'Sunucu Yönetimi';
    return '';
  };

  const renderItem = ({ item }: { item: any }) => {
    if (activeTab === 'licenses') return renderLicenseItem({ item });
    if (activeTab === 'users') return renderUserItem({ item });
    if (activeTab === 'servers') return renderServerItem({ item });
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <Link href="/" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'licenses' && styles.activeTab]} 
          onPress={() => setActiveTab('licenses')}
        >
          <Text style={[styles.tabText, activeTab === 'licenses' && styles.activeTabText]}>Lisanslar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]} 
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Kullanıcılar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'servers' && styles.activeTab]} 
          onPress={() => setActiveTab('servers')}
        >
          <Text style={[styles.tabText, activeTab === 'servers' && styles.activeTabText]}>Sunucular</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>{getTabTitle()}</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>+ Yeni</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        ) : (
          <FlatList
            data={getCurrentData()}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Düzenle' : 'Yeni Ekle'}
            </Text>
            
            {activeTab === 'licenses' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="E-posta adresi"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Bitiş tarihi (YYYY-MM-DD)"
                  value={formData.expiryDate}
                  onChangeText={(text) => setFormData({ ...formData, expiryDate: text })}
                />
              </>
            )}

            {activeTab === 'servers' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Sunucu adı"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ülke"
                  value={formData.country}
                  onChangeText={(text) => setFormData({ ...formData, country: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Şehir"
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="IP adresi"
                  value={formData.ip}
                  onChangeText={(text) => setFormData({ ...formData, ip: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Port"
                  value={formData.port}
                  onChangeText={(text) => setFormData({ ...formData, port: text })}
                  keyboardType="numeric"
                />
              </>
            )}

            {activeTab === 'users' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="E-posta adresi"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Lisans anahtarı"
                  value={formData.licenseKey}
                  onChangeText={(text) => setFormData({ ...formData, licenseKey: text })}
                  autoCapitalize="none"
                />
              </>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  backButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  item: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemUsage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#10B981',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 