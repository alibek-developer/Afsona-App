import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Platform,
    RefreshControl,
    StatusBar as RNStatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import OrderCard from '../components/OrderCard';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { useRealtimeOrdersSubscription } from '../hooks/useRealtimeOrders';

const { width } = Dimensions.get('window');

const ImprovedCourierScreen = () => {
  const { user, logout, authLoading } = useAuth();
  const { orders, loading, error, fetchOrders, currentCourierId } = useOrders();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Subscribe to real-time updates
  useRealtimeOrdersSubscription(fetchOrders);

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
            } catch (err) {
              console.log('Logout error:', err);
              Toast.show({
                type: 'error',
                text1: 'Xatolik',
                text2: 'Chiqishda xatolik yuz berdi'
              });
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
      Toast.show({
        type: 'success',
        text1: 'Yangilandi',
        text2: 'Buyurtmalar yangilandi'
      });
    } catch (err: any) {
      console.error('Error refreshing orders:', err);
      Toast.show({
        type: 'error',
        text1: 'Xatolik',
        text2: err.message || 'Yangilashda xatolik yuz berdi'
      });
    } finally {
      setRefreshing(false);
    }
  };

  // ==================== RENDER ORDERS LIST ====================
  const renderOrdersList = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E53935" />
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
          <MaterialCommunityIcons name="inbox-outline" size={72} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Buyurtmalar yo'q</Text>
          <Text style={styles.emptySubtitle}>Yangi buyurtmalar bu yerda ko'rinadi</Text>
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
            <Text style={styles.headerTitle}>Kuryer</Text>
            <Text style={styles.headerSubtitle}>{user?.email}</Text>
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={authLoading}
          activeOpacity={0.75}
        >
          {authLoading ? (
            <ActivityIndicator size="small" color="#E53935" />
          ) : (
            <MaterialCommunityIcons name="logout" size={24} color="#E53935" />
          )}
        </TouchableOpacity>
      </View>

      {/* ORDERS COUNT BADGE */}
      {orders.length > 0 && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            Jami: <Text style={styles.countNumber}>{orders.length}</Text> ta buyurtma
          </Text>
        </View>
      )}

      {/* ORDERS LIST */}
      {renderOrdersList()}

      {/* Toast Component */}
      <Toast />
    </SafeAreaView>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  // ==================== HEADER ====================
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 4 : (RNStatusBar.currentHeight || 0) + 4,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ==================== COUNT ROW ====================
  countRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  countText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  countNumber: {
    color: '#E53935',
    fontWeight: '700',
  },

  // ==================== LIST ====================
  listContent: {
    padding: 20,
    paddingBottom: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    color: '#374151',
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default ImprovedCourierScreen;