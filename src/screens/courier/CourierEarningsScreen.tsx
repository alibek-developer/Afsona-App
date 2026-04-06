import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
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
import { useAuth } from '../../context/AuthContext'
import { fetchCourierEarnings, useOrders } from '../../hooks/useOrders'

const CourierEarningsScreen = () => {
  const { user } = useAuth()
  const { initialLoading, error, fetchOrders } = useOrders()
  const [earnings, setEarnings] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadEarnings = useCallback(async () => {
    if (!user?.id) return
    const data = await fetchCourierEarnings(user.id)
    setEarnings(data)
  }, [user?.id])

  useEffect(() => {
    loadEarnings()
  }, [loadEarnings])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([loadEarnings(), fetchOrders()])
    setRefreshing(false)
  }, [loadEarnings, fetchOrders])

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
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
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
          <Text style={styles.headerTitle}>Daromad</Text>
          <Text style={styles.headerSub}>Yetkazilgan buyurtmalar statistikasi</Text>
        </View>
        <TouchableOpacity style={styles.refreshIcon} onPress={onRefresh} disabled={refreshing}>
          <MaterialCommunityIcons name={refreshing ? 'loading' : 'refresh'} size={22} color="#E53935" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[{ key: 'content' }]}
        keyExtractor={() => 'content'}
        renderItem={() => (
          <View>
            {/* Today Card */}
            <View style={styles.todayCard}>
              <View style={styles.todayHeader}>
                <MaterialCommunityIcons name="calendar-today" size={20} color="#10B981" />
                <Text style={styles.todayLabel}>Bugun</Text>
              </View>
              <Text style={styles.todayAmount}>
                {earnings?.todayTotal?.toLocaleString() || '0'} so'm
              </Text>
              <Text style={styles.todayCount}>
                {earnings?.todayCount || 0} ta yetkazildi
              </Text>
            </View>

            {/* Week Card */}
            <View style={styles.weekCard}>
              <View style={styles.weekHeader}>
                <MaterialCommunityIcons name="calendar-week" size={20} color="#3B82F6" />
                <Text style={styles.weekLabel}>Shu hafta</Text>
              </View>
              <View style={styles.weekStats}>
                <View style={styles.weekStat}>
                  <Text style={styles.weekStatValue}>{earnings?.weekTotal?.toLocaleString() || '0'}</Text>
                  <Text style={styles.weekStatLabel}>Jami daromad</Text>
                </View>
                <View style={styles.weekDivider} />
                <View style={styles.weekStat}>
                  <Text style={styles.weekStatValue}>{earnings?.weekCount || 0}</Text>
                  <Text style={styles.weekStatLabel}>Yetkazildi</Text>
                </View>
              </View>
            </View>

            {/* All Time Card */}
            <View style={styles.allTimeCard}>
              <View style={styles.allTimeHeader}>
                <MaterialCommunityIcons name="trophy" size={20} color="#F59E0B" />
                <Text style={styles.allTimeLabel}>Umumiy</Text>
              </View>
              <View style={styles.allTimeStats}>
                <View style={styles.allTimeStat}>
                  <Text style={styles.allTimeStatValue}>{earnings?.totalEarnings?.toLocaleString() || '0'}</Text>
                  <Text style={styles.allTimeStatLabel}>Umumiy daromad</Text>
                </View>
                <View style={styles.allTimeDivider} />
                <View style={styles.allTimeStat}>
                  <Text style={styles.allTimeStatValue}>{earnings?.totalDelivered || 0}</Text>
                  <Text style={styles.allTimeStatLabel}>Jami yetkazildi</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E53935']} />
        }
      />
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

  todayCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  todayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  todayLabel: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  todayAmount: { fontSize: 32, fontWeight: '900', color: '#10B981', marginBottom: 4 },
  todayCount: { fontSize: 14, color: '#6B7280', fontWeight: '500' },

  weekCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  weekHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  weekLabel: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  weekStats: { flexDirection: 'row' },
  weekStat: { flex: 1, alignItems: 'center' },
  weekStatValue: { fontSize: 22, fontWeight: '800', color: '#3B82F6' },
  weekStatLabel: { fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '500' },
  weekDivider: { width: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },

  allTimeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  allTimeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  allTimeLabel: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  allTimeStats: { flexDirection: 'row' },
  allTimeStat: { flex: 1, alignItems: 'center' },
  allTimeStatValue: { fontSize: 22, fontWeight: '800', color: '#F59E0B' },
  allTimeStatLabel: { fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '500' },
  allTimeDivider: { width: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },
})

export default CourierEarningsScreen
