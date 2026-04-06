import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
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
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { useAuth } from '../context/AuthContext'
import { useOrders, fetchCourierEarnings, CourierEarnings } from '../hooks/useOrders'

const { width } = Dimensions.get('window')

const CourierScreen = () => {
  const navigation = useNavigation<any>()
  const { user, logout, authLoading } = useAuth()
  const { orders, groupedOrders, myActiveOrders, initialLoading, error, fetchOrders, currentCourierId } = useOrders()
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [earnings, setEarnings] = useState<CourierEarnings | null>(null)
  const [showEarnings, setShowEarnings] = useState(false)

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
              await logout()
            } catch (err) {
              console.log('Logout error:', err)
            }
          },
        },
      ]
    )
  }

  const refreshData = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        fetchOrders(),
        currentCourierId ? fetchCourierEarnings(currentCourierId).then(setEarnings) : Promise.resolve(),
      ])
    } catch (err: any) {
      console.error('Error refreshing orders:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const handleOrderPress = (order: any) => {
    navigation.navigate('CourierOrderDetail', {
      order,
      currentCourierId,
    })
  }

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const { success, error: acceptError } = await import('../hooks/useOrders').then(m => m.acceptOrder(orderId, currentCourierId))
      if (success) {
        Toast.show({
          type: 'success',
          text1: 'Qabul qilindi',
          text2: 'Buyurtma qabul qilindi ✅'
        })
        fetchOrders()
      } else {
        Alert.alert('Xatolik', acceptError || 'Buyurtmani qabul qilishda xatolik')
      }
    } catch (err: any) {
      Alert.alert('Xatolik', err.message)
    }
  }

  // ==================== ORDER CARD ====================
  const renderOrderCard = (item: any, showAccept: boolean = false) => {
    const statusConfig = getStatusConfig(item.status)
    const isMine = item.courier_id === currentCourierId
    const shortAddress = item.delivery_address
      ? item.delivery_address.split(',').slice(0, 2).join(', ')
      : "Manzil yo'q"
    const time = new Date(item.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.orderCard}
        activeOpacity={0.7}
        onPress={() => handleOrderPress(item)}
      >
        <View style={styles.cardTop}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          <Text style={styles.timeText}>{time}</Text>
        </View>

        <View style={styles.cardMiddle}>
          <View style={styles.customerAvatar}>
            <MaterialCommunityIcons name="account" size={20} color="#E53935" />
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName} numberOfLines={1}>{item.customer_name}</Text>
            <Text style={styles.addressText} numberOfLines={1}>{shortAddress}</Text>
          </View>
          {isMine && (
            <View style={styles.myBadge}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#10B981" />
              <Text style={styles.myBadgeText}>Mening</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.priceText}>{Number(item.total_amount || 0).toLocaleString()} so'm</Text>
          <View style={styles.typeBadge}>
            <MaterialCommunityIcons
              name={item.order_type === 'delivery' ? 'moped' : 'silverware-fork-knife'}
              size={14}
              color="#6B7280"
            />
            <Text style={styles.typeText}>
              {item.order_type === 'delivery' ? 'Yetkazish' : 'Zal'}
            </Text>
          </View>
        </View>

        {showAccept && !isMine && (
          <TouchableOpacity
            style={styles.acceptButton}
            activeOpacity={0.8}
            onPress={(e) => {
              e.stopPropagation()
              handleAcceptOrder(item.id)
            }}
          >
            <MaterialCommunityIcons name="map-marker-plus" size={18} color="#FFF" />
            <Text style={styles.acceptButtonText}>Marshrutga qo'shish</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  }

  // ==================== SECTION RENDERER ====================
  const renderSection = (title: string, icon: any, data: any[], showAccept: boolean = false) => {
    if (data.length === 0) return null
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name={icon} size={18} color="#E53935" />
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.sectionCount}>
            <Text style={styles.sectionCountText}>{data.length}</Text>
          </View>
        </View>
        {data.map((item) => renderOrderCard(item, showAccept))}
      </View>
    )
  }

  // ==================== MAIN RENDER ====================
  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E53935" />
          <Text style={styles.loadingText}>Buyurtmalar yuklanmoqda...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryButtonText}>Qayta urinib ko'rish</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const totalActive = groupedOrders.ready.length + groupedOrders.accepted.length + groupedOrders.onTheWay.length

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

        <View style={styles.headerActions}>
          {earnings && (
            <TouchableOpacity
              style={styles.earningsButton}
              onPress={() => setShowEarnings(!showEarnings)}
            >
              <MaterialCommunityIcons name="cash" size={20} color="#10B981" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={authLoading}
          >
            <MaterialCommunityIcons name="logout" size={22} color="#E53935" />
          </TouchableOpacity>
        </View>
      </View>

      {/* STATS BAR */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalActive}</Text>
          <Text style={styles.statLabel}>Faol</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{groupedOrders.ready.length}</Text>
          <Text style={styles.statLabel}>Yangi</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{myActiveOrders.length}</Text>
          <Text style={styles.statLabel}>Menda</Text>
        </View>
      </View>

      {/* EARNINGS CARD */}
      {showEarnings && earnings && (
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <MaterialCommunityIcons name="chart-line" size={20} color="#10B981" />
            <Text style={styles.earningsTitle}>Daromad</Text>
          </View>
          <View style={styles.earningsGrid}>
            <View style={styles.earningItem}>
              <Text style={styles.earningValue}>{earnings.todayTotal.toLocaleString()}</Text>
              <Text style={styles.earningLabel}>Bugun</Text>
            </View>
            <View style={styles.earningItem}>
              <Text style={styles.earningValue}>{earnings.todayCount}</Text>
              <Text style={styles.earningLabel}>Yetkazildi</Text>
            </View>
            <View style={styles.earningItem}>
              <Text style={styles.earningValue}>{earnings.weekTotal.toLocaleString()}</Text>
              <Text style={styles.earningLabel}>Hafta</Text>
            </View>
          </View>
        </View>
      )}

      {/* ORDERS LIST */}
      {totalActive === 0 ? (
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
      ) : (
        <FlatList
          data={[{ key: 'sections' }]}
          keyExtractor={() => 'sections'}
          renderItem={() => (
            <View>
              {renderSection('Yangi buyurtmalar', 'inbox-arrow-down', groupedOrders.ready, true)}
              {renderSection('Qabul qilindi', 'check-circle-outline', groupedOrders.accepted)}
              {renderSection("Yo'lda", 'truck-delivery', groupedOrders.onTheWay)}
            </View>
          )}
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
      )}

      <Toast />
    </SafeAreaView>
  )
}

// ==================== STATUS CONFIG ====================
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'ready':
      return { label: 'Tayyor', color: '#10B981', bgColor: '#ECFDF5' }
    case 'accepted':
      return { label: 'Qabul qilindi', color: '#3B82F6', bgColor: '#EFF6FF' }
    case 'on_the_way':
      return { label: "Yo'lda", color: '#F59E0B', bgColor: '#FFFBEB' }
    case 'delivered':
      return { label: 'Yetkazildi', color: '#6B7280', bgColor: '#F3F4F6' }
    default:
      return { label: status, color: '#6B7280', bgColor: '#F3F4F6' }
  }
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : (RNStatusBar.currentHeight || 0) + 8,
    paddingBottom: 16,
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  earningsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // STATS BAR
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E53935',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },

  // EARNINGS CARD
  earningsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  earningsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  earningItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  earningValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  earningLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },

  // SECTIONS
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionCount: {
    backgroundColor: '#E53935',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ORDER CARD
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  cardMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    color: '#6B7280',
  },
  myBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  myBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#E53935',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53935',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // LIST
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
})

export default CourierScreen
