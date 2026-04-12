import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { acceptOrder, useOrders } from '../../hooks/useOrders'

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  ready: { bg: '#ECFDF5', color: '#10B981', label: "Tayyor" },
  accepted: { bg: '#EFF6FF', color: '#3B82F6', label: "Qabul qilindi" },
  on_the_way: { bg: '#FFFBEB', color: '#F59E0B', label: "Yo'lda" },
}

const CourierOrdersScreen = () => {
  const navigation = useNavigation<any>()
  const { orders, setOrders, groupedOrders, initialLoading, error, fetchOrders, currentCourierId } = useOrders()
  const [refreshing, setRefreshing] = useState(false)
  const [acceptingIds, setAcceptingIds] = useState<Set<string>>(new Set())

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }, [fetchOrders])

  const handleAccept = async (orderId: string) => {
    if (acceptingIds.has(orderId)) return
    setAcceptingIds(prev => new Set(prev).add(orderId))

    // Optimistic update: immediately move order from ready to accepted
    const orderToMove = orders.find(o => o.id === orderId)
    if (orderToMove) {
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: 'accepted' as const, courier_id: currentCourierId } : o
      ))
    }

    try {
      const { success, error: acceptError } = await acceptOrder(orderId, currentCourierId)
      if (success) {
        Toast.show({ type: 'success', text1: "Marshrutga qo'shildi ✅" })
        // Targeted refetch to sync with server
        await fetchOrders()
      } else {
        // Rollback on error
        if (orderToMove) {
          setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, status: 'ready' as const, courier_id: null } : o
          ))
        }
        Alert.alert('Xatolik', acceptError || "Marshrutga qo'shishda xatolik")
      }
    } catch (err: any) {
      // Rollback on error
      if (orderToMove) {
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, status: 'ready' as const, courier_id: null } : o
        ))
      }
      Alert.alert('Xatolik', err.message)
    } finally {
      setAcceptingIds(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }

  const handleOrderPress = (order: any) => {
    navigation.navigate('CourierOrderDetail', { order, currentCourierId })
  }

  const renderOrderCard = ({ item }: { item: any }) => {
    const sc = STATUS_COLORS[item.status] || STATUS_COLORS.ready
    const isMine = item.courier_id === currentCourierId
    const isAccepting = acceptingIds.has(item.id)
    const time = item.created_at
      ? new Date(item.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      : '--:--'
    const shortAddr = item.delivery_address
      ? item.delivery_address.split(',').slice(0, 2).join(', ')
      : "Manzil yo'q"

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handleOrderPress(item)}
      >
        <View style={styles.cardTop}>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
          </View>
          <Text style={styles.timeText}>{time}</Text>
        </View>

        <View style={styles.cardMiddle}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={18} color="#E53935" />
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{item.customer_name}</Text>
            <Text style={styles.address} numberOfLines={1}>{shortAddr}</Text>
          </View>
          {isMine && (
            <View style={styles.mineBadge}>
              <MaterialCommunityIcons name="check-circle" size={12} color="#10B981" />
              <Text style={styles.mineText}>Mening</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.price}>{Number(item.total_amount || 0).toLocaleString()} so'm</Text>
          <View style={styles.typeBadge}>
            <MaterialCommunityIcons
              name={item.order_type === 'delivery' ? 'moped' : 'silverware-fork-knife'}
              size={13}
              color="#6B7280"
            />
            <Text style={styles.typeText}>{item.order_type === 'delivery' ? 'Yetkazish' : 'Zal'}</Text>
          </View>
        </View>

        {item.status === 'ready' && !isMine && (
          <TouchableOpacity
            style={[styles.acceptBtn, isAccepting && styles.acceptBtnDisabled]}
            activeOpacity={0.8}
            onPress={(e) => { e.stopPropagation(); handleAccept(item.id) }}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="map-marker-plus" size={16} color="#FFF" />
                <Text style={styles.acceptBtnText}>Marshrutga qo'shish</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  }

  const allOrders = [...groupedOrders.ready, ...groupedOrders.accepted, ...groupedOrders.onTheWay]

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E53935" />
          <Text style={styles.loadingText}>Yuklanmoqda...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
            <Text style={styles.retryBtnText}>Qayta urinish</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Buyurtmalar</Text>
          <Text style={styles.headerSub}>
            {allOrders.length > 0 ? `${allOrders.length} ta buyurtma` : 'Buyurtmalar yo\'q'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshIcon} onPress={onRefresh} disabled={refreshing}>
          <MaterialCommunityIcons
            name={refreshing ? 'loading' : 'refresh'}
            size={22}
            color="#E53935"
          />
        </TouchableOpacity>
      </View>

      {allOrders.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="inbox-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Hozircha buyurtmalar yo'q</Text>
          <Text style={styles.emptySub}>Yangi buyurtmalar shu yerda ko'rinadi</Text>
        </View>
      ) : (
        <FlatList
          data={allOrders}
          keyExtractor={item => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E53935']} />
          }
        />
      )}

      <Toast />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 16, fontSize: 15, color: '#94A3B8', fontWeight: '600' },
  errorText: { marginTop: 12, fontSize: 15, color: '#EF4444', fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: '#E53935', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : (RNStatusBar.currentHeight || 0) + 8,
    paddingBottom: 16,
    backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  refreshIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center' },

  list: { padding: 16, paddingBottom: 100 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  timeText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

  cardMiddle: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  address: { fontSize: 12, color: '#6B7280' },
  mineBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  mineText: { fontSize: 10, fontWeight: '600', color: '#10B981' },

  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 16, fontWeight: '800', color: '#E53935' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },

  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E53935', borderRadius: 12, paddingVertical: 10, marginTop: 10, gap: 6 },
  acceptBtnDisabled: { opacity: 0.6 },
  acceptBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '800', color: '#374151' },
  emptySub: { marginTop: 6, fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
})

export default CourierOrdersScreen
