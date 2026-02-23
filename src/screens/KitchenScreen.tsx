import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
    StatusBar as RNStatusBar,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { Order, OrderStatus } from '../hooks/useRealtimeOrders'
import { MOCK_ORDERS } from '../lib/mocks'
import { supabase } from '../lib/supabase'

// ==================== MAIN COMPONENT ====================
export default function KitchenScreen() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // ==================== FETCH ORDERS ====================
  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Supabase'dan yangi va tayyorlanayotgan buyurtmalarni olish
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['new', 'tayyorlanmoqda'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error, using mock fallback:', error);
        setOrders(MOCK_ORDERS.map(item => ({
          ...item,
          customer_name: item.customer_name || 'Demo',
          customer_phone: item.customer_phone || '',
        })) as any);
        Alert.alert('Eslatma', 'Ma\'mulotlar bazasi bilan aloqa uzildi. Namuna ma\'lumotlar ko\'rsatilmoqda.');
        return;
      }

      if (!data || data.length === 0) {
        console.warn('No active orders found, using mock data');
        setOrders(MOCK_ORDERS as any);
      } else {
        setOrders(data as any);
      }
    } catch (error) {
      console.error('Error fetching orders, using mock fallback:', error);
      setOrders(MOCK_ORDERS as any);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // ==================== UPDATE ORDER STATUS ====================
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        console.error('Supabase update error:', error);
        Alert.alert('Xatolik', 'Buyurtma holatini yangilashda xatolik');
        return;
      }

      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      const statusLabels: Record<string, string> = {
        'preparing': 'tayyorlanmoqda',
        'tayyorlanmoqda': 'tayyorlanmoqda',
        'ready': 'tayyor',
        'tayyor': 'tayyor'
      };
      
      const statusText = statusLabels[newStatus] || newStatus;
      Alert.alert('Muvaffaqiyatli', `Buyurtma holati: ${statusText}`);
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Xatolik', 'Buyurtma holatini yangilashda xatolik');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Chiqish',
      'Hisobdan chiqishni xohlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { 
          text: 'Chiqish', 
          style: 'destructive',
          onPress: logout
        },
      ]
    );
  };

  const getStatusColor = (status: OrderStatus) => {
    const s = status.toLowerCase();
    if (s.includes('yangi') || s.includes('new') || s.includes('pending')) return '#F59E0B';
    if (s.includes('tayyorlanmoqda') || s.includes('preparing') || s.includes('qabul')) return '#3B82F6';
    if (s.includes('tayyor') || s.includes('ready')) return '#10B981';
    if (s.includes('on_the_way')) return '#8B5CF6';
    if (s.includes('yetkazildi') || s.includes('delivered')) return '#6B7280';
    if (s.includes('bekor') || s.includes('cancelled')) return '#EF4444';
    return '#6B7280';
  };

  const getStatusText = (status: OrderStatus) => {
    const s = status.toLowerCase();
    if (s.includes('yangi') || s.includes('new') || s.includes('pending')) return 'Yangi';
    if (s.includes('tayyorlanmoqda') || s.includes('preparing') || s.includes('qabul')) return 'Tayyorlanmoqda';
    if (s.includes('tayyor') || s.includes('ready')) return 'Tayyor';
    if (s.includes('on_the_way')) return 'Kuryerda';
    if (s.includes('yetkazildi') || s.includes('delivered')) return 'Yetkazildi';
    if (s.includes('bekor') || s.includes('cancelled')) return 'Bekor qilindi';
    return status;
  };

  const renderOrderItem = (order: Order) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderId} numberOfLines={1}>{order.id.substring(0, 8)}...</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.orderTime}>
          {new Date(order.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.orderTypeContainer}>
        <MaterialCommunityIcons 
          name={order.type === 'dine-in' ? 'storefront-outline' : 'moped-outline'} 
          size={16} 
          color="#6B7280" 
        />
        <Text style={styles.orderTypeText}>
          {order.type === 'dine-in' ? `Stol ${order.table_number || '?'}` : 'Yetkazib berish'}
        </Text>
      </View>

      <View style={styles.itemsContainer}>
        {(order.items || []).map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemQuantity}>{item.quantity || 1}x</Text>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>{((item.price || 0) * (item.quantity || 1)).toLocaleString()} so'm</Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{order.customer_name || 'Noma\'lum'}</Text>
          <Text style={styles.customerPhone}>{order.customer_phone || ''}</Text>
        </View>
        <Text style={styles.totalAmount}>{(order.total_amount || 0).toLocaleString()} so'm</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton, 
            { backgroundColor: '#3B82F6' },
            !['yangi', 'new'].includes(order.status) && styles.disabledButton
          ]}
          onPress={() => updateOrderStatus(order.id, 'tayyorlanmoqda')}
          disabled={!['yangi', 'new'].includes(order.status)}
        >
          <MaterialCommunityIcons 
            name="checkbox-marked-circle-outline" 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.actionButtonText}>Qabul qilish</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton, 
            { backgroundColor: '#10B981' },
            !['tayyorlanmoqda'].includes(order.status) && styles.disabledButton
          ]}
          onPress={() => updateOrderStatus(order.id, 'ready')}
          disabled={!['tayyorlanmoqda'].includes(order.status)}
        >
          <MaterialCommunityIcons 
            name="check-circle-outline" 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.actionButtonText}>Tayyor</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#FF0000" />
        <Text style={styles.loadingText}>Buyurtmalar yuklanmoqda...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="chef-hat" size={28} color="#FF0000" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Oshxona</Text>
              <Text style={styles.headerSubtitle}>{user?.email}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={24} color="#FF0000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF0000']} />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="inbox-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Hozircha buyurtmalar yo'q</Text>
          </View>
        ) : (
          <View style={styles.ordersContainer}>
            {orders.map(renderOrderItem)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDFDFD',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 50 : (RNStatusBar.currentHeight || 0) + 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FFF1F1',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  ordersContainer: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    gap: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  orderTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  orderTypeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  itemsContainer: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF0000',
    minWidth: 24,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  customerInfo: {
    gap: 2,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  customerPhone: {
    fontSize: 12,
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF0000',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    flex: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    opacity: 0.7,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});
