import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import OrderCard from '../components/OrderCard'
import { useAuth } from '../context/AuthContext'
import { useOrders } from '../hooks/useOrders'

const { width } = Dimensions.get('window');

const CourierScreen = () => {
  const { user, logout, authLoading } = useAuth();
  const { orders, loading, error, fetchOrders, currentCourierId } = useOrders();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Subscription is now handled inside useOrders hook

  // ==================== LOGOUT ====================
  const handleLogout = () => {
    Alert.alert(
      'Chiqish',
      'Tizimdan chiqishni xohlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Chiqish',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // AppNavigator listens to auth state — will auto-redirect to login
            } catch (err) {
              console.log('Logout error:', err);
            }
          },
        },
      ]
    );
  };

  // ==================== REFRESH ====================
  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchOrders();
    } catch (err: any) {
      console.error('Error refreshing orders:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // ==================== RENDER ORDERS LIST ====================
  const renderOrdersList = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Buyurtmalar yuklanmoqda...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryButtonText}>Qayta urinib ko'rish</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (orders.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <MaterialCommunityIcons name="package-variant" size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>Hozircha buyurtmalar yo'q</Text>
          <Text style={styles.emptySubtitle}>Yangi buyurtmalar kelishi bilan shu yerda ko'rinadi</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchOrders}>
            <Text style={styles.refreshBtnText}>Yangilash</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={orders}
        renderItem={({ item }) => (
          <OrderCard order={item} currentCourierId={currentCourierId} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            colors={['#E53935']}
            tintColor="#E53935"
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="motorbike" size={24} color="#E53935" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Kuryer Paneli</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={authLoading}
        >
          <MaterialCommunityIcons name="logout" size={22} color="#E53935" />
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        {renderOrdersList()}
      </View>
    </SafeAreaView>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 16,
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#334155',
  },
  emptySubtitle: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshBtn: {
    marginTop: 30,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E53935',
  },
  refreshBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
});

export default CourierScreen;