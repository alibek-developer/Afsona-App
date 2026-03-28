import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const MAIN_RED = '#FF0000'

interface PaymentSuccessRouteParams {
  orderId?: string
  amount?: number
}

const PaymentSuccessScreen = () => {
  const navigation = useNavigation<any>()
  const route = useRoute()
  const insets = useSafeAreaInsets()
  const { orderId, amount } = (route.params as PaymentSuccessRouteParams) || {}

  const handleGoToOrders = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    })
  }

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [
        { name: 'Main' },
      ],
    })
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 40 : insets.top }]}>
      <StatusBar barStyle='dark-content' backgroundColor="#FDFDFD" translucent />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.checkCircle}>
            <MaterialCommunityIcons name='check' size={60} color='#FFFFFF' />
          </View>
          <View style={styles.pulseRing} />
        </View>

        <Text style={styles.title}>To'lov muvaffaqiyatli yakunlandi</Text>
        
        {orderId && (
          <View style={styles.orderInfo}>
            <Text style={styles.orderLabel}>Buyurtma raqami</Text>
            <Text style={styles.orderId}>#{orderId.slice(0, 8).toUpperCase()}</Text>
          </View>
        )}

        {amount && (
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>To'langan summa</Text>
            <Text style={styles.amountValue}>{amount.toLocaleString('uz-UZ')} so'm</Text>
          </View>
        )}

        <Text style={styles.message}>
          Buyurtmangiz tez orada tayyorlanadi. Buyurtmalar bo'limida holatini kuzatib boring.
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.ordersButton} onPress={handleGoToOrders} activeOpacity={0.8}>
          <MaterialCommunityIcons name='clipboard-text-outline' size={22} color='#FFFFFF' />
          <Text style={styles.ordersButtonText}>BUYURTMALARIM</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeButton} onPress={handleGoHome} activeOpacity={0.8}>
          <MaterialCommunityIcons name='home-outline' size={22} color={MAIN_RED} />
          <Text style={styles.homeButtonText}>ASOSIY SAHIFA</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  orderInfo: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  orderLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  amountContainer: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  amountLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#059669',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  ordersButton: {
    backgroundColor: MAIN_RED,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ordersButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  homeButton: {
    backgroundColor: '#F9FAFB',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  homeButtonText: {
    color: MAIN_RED,
    fontWeight: '900',
    fontSize: 16,
  },
})

export default PaymentSuccessScreen
