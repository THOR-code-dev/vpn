import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
// import { ArrowLeft, ShoppingCart, CheckCircle2 } from '../components/Icons';

export default function PurchaseScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleBack = () => {
    router.back();
  };

  const handlePurchase = (plan: string) => {
    // For demo purposes, we'll just open a mock payment page
    // In a real app, this would integrate with Stripe or another payment provider
    Alert.alert('Satın Alındı', `Seçtiğiniz plan: ${plan}`);
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Aylık',
      price: '$9.99',
      duration: 'aylık',
      features: ['Tüm sunuculara erişim', 'Sınırsız bant genişliği', '1 cihaz bağlantısı'],
      popular: false,
    },
    {
      id: 'yearly',
      name: 'Yıllık',
      price: '$59.99',
      duration: 'yıllık',
      features: ['Tüm sunuculara erişim', 'Sınırsız bant genişliği', '5 cihaz bağlantısı', 'Öncelikli destek'],
      popular: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={{ fontSize: 24, color: '#3B82F6' }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lisans Satın Al</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Text style={{ fontSize: 80, color: '#3B82F6' }}>🛡️</Text>
          <Text style={styles.logoText}>SecureVPN</Text>
        </View>
        
        <Text style={styles.description}>
          VPN hizmetimizi kullanmaya başlamak için bir lisans planı seçin
        </Text>
        
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
          <TouchableOpacity 
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlan,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
          >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Popüler</Text>
            </View>
              )}
              
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text style={styles.planDuration}>{plan.duration}</Text>
            
            <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Text style={{ fontSize: 16, color: '#10B981' }}>✅</Text>
                    <Text style={styles.featureText}>{feature}</Text>
              </View>
                ))}
              </View>
              
              {selectedPlan === plan.id && (
                <View style={styles.selectedIndicator}>
                  <Text style={{ fontSize: 20, color: '#10B981' }}>✅</Text>
              </View>
              )}
            </TouchableOpacity>
          ))}
            </View>
            
            <TouchableOpacity 
          style={[styles.purchaseButton, { opacity: selectedPlan ? 1 : 0.5 }]}
          onPress={() => handlePurchase(selectedPlan)}
          disabled={!selectedPlan}
            >
          <Text style={{ fontSize: 20, color: '#FFFFFF' }}>🛒</Text>
          <Text style={styles.purchaseButtonText}>Satın Al</Text>
          </TouchableOpacity>
      </ScrollView>
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
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
  },
  plansContainer: {
    width: '100%',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedPlan: {
    backgroundColor: '#3B82F6',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 24,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  planDuration: {
    fontSize: 14,
    color: '#64748B',
  },
  planFeatures: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#1E293B',
    marginLeft: 8,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  purchaseButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});