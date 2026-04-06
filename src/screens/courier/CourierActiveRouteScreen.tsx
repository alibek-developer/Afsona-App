import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import * as Location from 'expo-location'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
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
import { deliverOrder, useOrders } from '../../hooks/useOrders'

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  accepted: { bg: '#EFF6FF', color: '#3B82F6', label: "Qabul qilindi", icon: "check-circle-outline" },
  on_the_way: { bg: '#FFFBEB', color: '#F59E0B', label: "Yo'lda", icon: "truck-delivery" },
}

const CourierActiveRouteScreen = () => {
  const navigation = useNavigation<any>()
  const { myActiveOrders, initialLoading, error, fetchOrders, currentCourierId } = useOrders()
  const [refreshing, setRefreshing] = useState(false)
  const [deliveringId, setDeliveringId] = useState<string | null>(null)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }, [fetchOrders])

  const handleDeliver = async (orderId: string) => {
    if (deliveringId) return
    setDeliveringId(orderId)
    try {
      const { success, error: deliverError } = await deliverOrder(orderId, currentCourierId)
      if (success) {
        Toast.show({ type: 'success', text1: "Yetkazildi ✅" })
        await fetchOrders()
      } else {
        Alert.alert('Xatolik', deliverError || "Yetkazishda xatolik")
      }
    } catch (err: any) {
      Alert.alert('Xatolik', err.message)
    } finally {
      setDeliveringId(null)
    }
  }

  const handleCall = (phone: string) => {
    if (!phone) return
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`)
  }

  const handleNavigate = (lat: number, lng: number) => {
    const url = `google.navigation:q=${lat},${lng}`
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) return Linking.openURL(url)
        return Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`)
      })
      .catch(() => Alert.alert('Xatolik', 'Navigatsiya ochilmadi'))
  }

  const handleOrderDetail = (order: any) => {
    navigation.navigate('CourierOrderDetail', { order, currentCourierId })
  }

  // ==================== MULTI-STOP ROUTE LAUNCHER ====================
  const [routeLoading, setRouteLoading] = useState(false)

  const handleOpenMultiStopRoute = async () => {
    // Filter only delivery orders with valid coordinates
    const routableOrders = myActiveOrders.filter(
      o => o.order_type === 'delivery' && o.latitude && o.longitude
    )

    if (routableOrders.length === 0) {
      Alert.alert(
        "Manzil yo'q",
        'Faol buyurtmalar orasida manzili bo\'lgan yetkazmalar topilmadi.'
      )
      return
    }

    setRouteLoading(true)

    try {
      // Get courier's current location
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Ruxsat kerak', 'Joylashuv ruxsatini yoqing.')
        setRouteLoading(false)
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const startLat = currentLocation.coords.latitude
      const startLng = currentLocation.coords.longitude

      // Build waypoints from active orders (preserve list order = delivery sequence)
      const waypoints = routableOrders.map(o => `${o.latitude},${o.longitude}`)

      // Google Maps multi-stop URL
      // Format: https://www.google.com/maps/dir/?api=1&origin=lat,lng&destination=lat,lng&waypoints=lat,lng|lat,lng&travelmode=driving
      const destination = waypoints[waypoints.length - 1]
      const waypointsStr = waypoints.slice(0, -1).join('|')

      let url: string

      if (waypoints.length === 1) {
        // Single stop — simple navigation
        url = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${destination}&travelmode=driving`
      } else {
        // Multi-stop route
        url = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${destination}&waypoints=${encodeURIComponent(waypointsStr)}&travelmode=driving`
      }

      console.log('[MultiStopRoute] Opening:', url)
      console.log('[MultiStopRoute] Stops:', routableOrders.length, 'Waypoints:', waypoints.length)

      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        // Fallback: try google.navigation: for Android
        if (waypoints.length === 1) {
          const fallbackUrl = `google.navigation:q=${routableOrders[0].latitude},${routableOrders[0].longitude}`
          const fbSupported = await Linking.canOpenURL(fallbackUrl)
          if (fbSupported) {
            await Linking.openURL(fallbackUrl)
          } else {
            Alert.alert('Xatolik', 'Google Maps ochilmadi. Iltimos, Google Maps ilovasini o\'rnating.')
          }
        } else {
          Alert.alert('Xatolik', 'Ko\'p manzilli marshrutni ochib bo\'lmadi. Iltimos, Google Maps ilovasini o\'rnating.')
        }
      }
    } catch (err: any) {
      console.error('[MultiStopRoute] Error:', err)
      Alert.alert('Xatolik', err.message || 'Marshrutni ochishda xatolik')
    } finally {
      setRouteLoading(false)
    }
  }

  const renderDeliveryCard = ({ item, index }: { item: any; index: number }) => {
    const sc = STATUS_COLORS[item.status] || STATUS_COLORS.accepted
    const isDelivering = deliveringId === item.id
    const time = item.created_at
      ? new Date(item.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      : '--:--'
    const shortAddr = item.delivery_address
      ? item.delivery_address.split(',').slice(0, 2).join(', ')
      : "Manzil yo'q"
    const isNext = index === 0

    return (
      <View style={[styles.card, isNext && styles.nextCard]}>
        {isNext && <View style={styles.nextBadge}><Text style={styles.nextBadgeText}>Keyingi</Text></View>}

        <View style={styles.cardTop}>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
          </View>
          <Text style={styles.timeText}>{time}</Text>
        </View>

        <View style={styles.cardMiddle}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.customer_name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{item.customer_name}</Text>
            <Text style={styles.address} numberOfLines={1}>{shortAddr}</Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.price}>{Number(item.total_amount || 0).toLocaleString()} so'm</Text>
          <View style={styles.actions}>
            {item.latitude && item.longitude && (
              <TouchableOpacity
                style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}
                onPress={() => handleNavigate(item.latitude, item.longitude)}
              >
                <MaterialCommunityIcons name="navigation" size={18} color="#3B82F6" />
              </TouchableOpacity>
            )}
            {item.phone && (
              <TouchableOpacity
                style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}
                onPress={() => handleCall(item.phone)}
              >
                <MaterialCommunityIcons name="phone" size={18} color="#10B981" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionIcon, { backgroundColor: '#F3F4F6' }]}
              onPress={() => handleOrderDetail(item)}
            >
              <MaterialCommunityIcons name="eye" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.deliverBtn, isDelivering && styles.deliverBtnDisabled]}
          activeOpacity={0.8}
          onPress={() => handleDeliver(item.id)}
          disabled={isDelivering}
        >
          {isDelivering ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="package-variant-closed-check" size={18} color="#FFF" />
              <Text style={styles.deliverBtnText}>Yetkazildi deb belgilash</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    )
  }

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

  const acceptedCount = myActiveOrders.filter(o => o.status === 'accepted').length
  const onTheWayCount = myActiveOrders.filter(o => o.status === 'on_the_way').length

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Faol Yo'nalish</Text>
          <Text style={styles.headerSub}>
            {myActiveOrders.length > 0
              ? `${myActiveOrders.length} ta faol yetkazilmoqda`
              : 'Faol yetkazilmalar yo\'q'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshIcon} onPress={onRefresh} disabled={refreshing}>
          <MaterialCommunityIcons name={refreshing ? 'loading' : 'refresh'} size={22} color="#E53935" />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      {myActiveOrders.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{myActiveOrders.length}</Text>
            <Text style={styles.summaryLabel}>Jami</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#3B82F6' }]}>{acceptedCount}</Text>
            <Text style={styles.summaryLabel}>Qabul</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#F59E0B' }]}>{onTheWayCount}</Text>
            <Text style={styles.summaryLabel}>Yo'lda</Text>
          </View>
        </View>
      )}

      {/* Multi-Stop Route Button */}
      {myActiveOrders.length > 0 && (
        <TouchableOpacity
          style={[styles.routeBtn, routeLoading && styles.routeBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleOpenMultiStopRoute}
          disabled={routeLoading}
        >
          <View style={styles.routeBtnIcon}>
            <MaterialCommunityIcons name="map-marker-path" size={24} color="#FFF" />
          </View>
          <View style={styles.routeBtnContent}>
            <Text style={styles.routeBtnTitle}>
              {myActiveOrders.filter(o => o.order_type === 'delivery' && o.latitude && o.longitude).length > 0
                ? "Marshrutni Google Maps'da ochish"
                : "Manzilli buyurtmalar yo'q"}
            </Text>
            <Text style={styles.routeBtnSub}>
              {myActiveOrders.filter(o => o.order_type === 'delivery' && o.latitude && o.longitude).length} ta yetkazma → bir marshrut
            </Text>
          </View>
          {routeLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.7)" />
          )}
        </TouchableOpacity>
      )}

      {myActiveOrders.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="truck-delivery-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Faol yetkazilmalar yo'q</Text>
          <Text style={styles.emptySub}>Buyurtmalarni qabul qiling va ular shu yerda ko'rinadi</Text>
        </View>
      ) : (
        <FlatList
          data={myActiveOrders}
          keyExtractor={item => item.id}
          renderItem={renderDeliveryCard}
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

  summary: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
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
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNumber: { fontSize: 22, fontWeight: '800', color: '#E53935' },
  summaryLabel: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  summaryDivider: { width: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },

  routeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  routeBtnDisabled: { opacity: 0.7 },
  routeBtnIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  routeBtnContent: { flex: 1 },
  routeBtnTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  routeBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

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
  nextCard: { borderWidth: 2, borderColor: '#E53935' },
  nextBadge: { position: 'absolute', top: -10, right: 14, backgroundColor: '#E53935', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  nextBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  timeText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

  cardMiddle: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#E53935' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  address: { fontSize: 12, color: '#6B7280' },

  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 16, fontWeight: '800', color: '#E53935' },
  actions: { flexDirection: 'row', gap: 8 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  deliverBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 12, marginTop: 12, gap: 8 },
  deliverBtnDisabled: { opacity: 0.6 },
  deliverBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '800', color: '#374151' },
  emptySub: { marginTop: 6, fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
})

export default CourierActiveRouteScreen
