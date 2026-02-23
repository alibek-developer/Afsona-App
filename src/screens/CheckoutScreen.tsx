import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Qo'shildi
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';
import { getOrCreateDeviceId } from '../lib/auth'; // Qo'shildi
import { MAX_DELIVERY_RADIUS_KM } from '../lib/constants';
import { supabase } from '../lib/supabase';
import {
    calculateDeliveryFee,
    calculateDistance,
    formatPrice,
} from '../lib/utils';

const MAIN_RED = '#FF0000'

const CheckoutScreen = () => {
  const { cartItems, getTotalPrice, clearCart } = useCart()
  const { orderType } = useOrder()
  const navigation = useNavigation<any>()

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('+998')
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [coords, setCoords] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [distance, setDistance] = useState<number>(0)
  const [address, setAddress] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [tableNumber, setTableNumber] = useState<string>('')
  const [showTableModal, setShowTableModal] = useState(false)

  const totals = useMemo(() => {
    const s = getTotalPrice()
    const d =
      orderType === 'delivery' && distance > 0
        ? calculateDeliveryFee(distance, s)
        : 0
    return {
      subtotal: s,
      deliveryFee: d,
      grandTotal: s + d,
    }
  }, [distance, orderType, cartItems, getTotalPrice])

  const isTooFar = distance > MAX_DELIVERY_RADIUS_KM

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^\d+]/g, '')
    if (cleaned.startsWith('+998')) {
      setCustomerPhone(cleaned)
    } else if (cleaned.length < 4) {
      setCustomerPhone('+998')
    }
  }

  const getCurrentLocation = async () => {
    setLoadingLocation(true)
    try {
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Ruxsat kerak', 'Iltimos, manzilni aniqlash uchun ruxsat bering.')
        return
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const { latitude, longitude } = location.coords
      setCoords({ latitude, longitude })

      const dist = calculateDistance(latitude, longitude)
      setDistance(dist)

      let reverseResult = await Location.reverseGeocodeAsync({ latitude, longitude })
      if (reverseResult.length > 0) {
        const addr = reverseResult[0]
        const addressString = `${addr.city || ''}, ${addr.street || "Nomsiz ko'cha"} ${addr.name || ''}`.trim()
        setAddress(addressString)

        if (dist > MAX_DELIVERY_RADIUS_KM) {
          Alert.alert('Masofa uzoq', `Masofa ${dist.toFixed(1)} km. Biz ${MAX_DELIVERY_RADIUS_KM} km gacha yetkazamiz.`)
        }
      }
    } catch (error) {
      Alert.alert('Xato', "Manzilni aniqlab bo'lmadi.")
    } finally {
      setLoadingLocation(false)
    }
  }

  const handleConfirmOrder = async () => {
    if (!customerName.trim() || customerPhone.length < 13) {
      Alert.alert('Xato', 'Ism va to\'liq telefon raqamini kiriting')
      return
    }

    if (orderType === 'delivery') {
      if (!coords || !address) {
        Alert.alert('Xato', 'Iltimos, avval manzilni aniqlang')
        return
      }
      if (isTooFar) {
        Alert.alert('Xato', 'Siz yetkazib berish hududidan tashqaridasiz')
        return
      }
    }

    if (orderType === 'dine-in' && !tableNumber) {
      Alert.alert('Xato', 'Stol raqamini tanlang')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Qurilma ID-sini olamiz
      const deviceId = await getOrCreateDeviceId();

      // 2. Buyurtmani device_id bilan birga yuboramiz
      const { error } = await supabase.from('orders').insert([
        {
          customer_name: customerName,
          phone: customerPhone, // Fixed column name
          device_id: deviceId,
          delivery_address: orderType === 'delivery' ? address : null,
          latitude: orderType === 'delivery' ? coords?.latitude : null,
          longitude: orderType === 'delivery' ? coords?.longitude : null,
          table_number: orderType === 'dine-in' ? tableNumber : null,
          type: orderType, // Fixed column name
          items: cartItems,
          total_amount: totals.grandTotal,
          payment_method: paymentMethod,
          status: 'yangi',
          source: 'mobile_app'
        },
      ])

      if (error) throw error

      // Raqamni eslab qolish (OrdersScreen filtrini kuchaytirish uchun)
      await AsyncStorage.setItem('phone', customerPhone);

      clearCart()
      Alert.alert('Rahmat!', 'Buyurtmangiz qabul qilindi ✅', [
        { text: 'OK', onPress: () => navigation.navigate('Main') },
      ])
    } catch (err: any) {
      console.error('Order submission error:', err);
      let errorMessage = 'Tarmoq xatosi yoki serverda muammo.';
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error) {
        errorMessage = err.error;
      }
      
      Alert.alert('Xato', `Buyurtma yuborishda xatolik: ${errorMessage}`);
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <StatusBar barStyle='dark-content' backgroundColor="#FDFDFD" translucent />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name='arrow-left' size={24} color='#1A1A1A' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rasmiylashtirish</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Shaxsiy ma'lumotlar</Text>
            <View style={styles.personalCard}>
              <TextInput
                placeholder='Ismingiz'
                value={customerName}
                onChangeText={setCustomerName}
                style={styles.input}
                placeholderTextColor='#9CA3AF'
              />
              <TextInput
                placeholder='Telefon (+998)'
                value={customerPhone}
                onChangeText={handlePhoneChange}
                keyboardType='phone-pad'
                style={styles.input}
                placeholderTextColor='#9CA3AF'
                maxLength={13}
              />
            </View>

            {orderType === 'delivery' ? (
              <>
                <Text style={styles.sectionTitle}>Yetkazib berish manzili</Text>
                <View style={styles.deliveryCard}>
                  {distance > 0 && (
                    <View style={[styles.distanceInfo, isTooFar ? styles.distanceTooFar : styles.distanceOk]}>
                      <Text style={styles.addressText}>{address}</Text>
                      <Text style={[styles.distanceText, isTooFar ? styles.distanceTextFar : styles.distanceTextOk]}>
                        📍 Masofa: {distance.toFixed(1)} km {isTooFar && '(Juda uzoq!)'}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={getCurrentLocation}
                    disabled={loadingLocation}
                    style={styles.locationButton}
                  >
                    {loadingLocation ? <ActivityIndicator color='#FFFFFF' /> : <Text style={styles.locationButtonText}>JOYLASHUVNI ANIQLASH</Text>}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.tableCard}>
                <Text style={styles.tableTitle}>STOL RAQAMI</Text>
                <TouchableOpacity style={styles.tableSelectorButton} onPress={() => setShowTableModal(true)}>
                  <Text style={styles.tableSelectorText}>{tableNumber ? `Stol ${tableNumber}` : 'Stol raqamini tanlang'}</Text>
                  <MaterialCommunityIcons name='chevron-down' size={24} color='#FFFFFF' />
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionTitle}>To'lov turi</Text>
            <View style={styles.paymentCard}>
              <View style={styles.paymentOptions}>
                {['cash', 'card'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.paymentOption, 
                      { backgroundColor: paymentMethod === method ? MAIN_RED : '#F3F4F6' }
                    ]}
                    onPress={() => setPaymentMethod(method)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons 
                      name={method === 'cash' ? 'cash' : 'credit-card'} 
                      size={24} 
                      color={paymentMethod === method ? '#FFFFFF' : '#9CA3AF'} 
                    />
                    <Text style={[
                      styles.paymentOptionText, 
                      { color: paymentMethod === method ? '#FFFFFF' : '#9CA3AF' }
                    ]}>
                      {method === 'cash' ? 'Naqd pul' : 'Karta'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Mahsulotlar:</Text>
              <Text style={styles.totalValue}>{formatPrice(totals.subtotal)}</Text>
            </View>
            {orderType === 'delivery' && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Yetkazib berish:</Text>
                <Text style={styles.deliveryValue}>{distance > 0 ? `+${formatPrice(totals.deliveryFee)}` : '0 so\'m'}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>JAMI:</Text>
              <Text style={styles.grandTotalValue}>{formatPrice(totals.grandTotal)}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleConfirmOrder}
            disabled={isSubmitting || (orderType === 'delivery' && (isTooFar || distance === 0))}
            style={[
                styles.confirmButton, 
                { backgroundColor: (isSubmitting || (orderType === 'delivery' && (isTooFar || distance === 0))) ? '#E5E7EB' : MAIN_RED }
            ]}
          >
            {isSubmitting ? <ActivityIndicator color='#FFFFFF' /> : <Text style={styles.confirmText}>BUYURTMANI TASDIQLASH</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showTableModal} animationType='slide' transparent={true}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTableModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Stol raqamini tanlang</Text>
            <FlatList
              data={Array.from({ length: 20 }, (_, i) => i + 1)}
              keyExtractor={(item) => item.toString()}
              numColumns={4}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.tableNumberButton}
                  onPress={() => {
                    setTableNumber(item.toString())
                    setShowTableModal(false)
                  }}
                >
                  <Text style={styles.tableNumberText}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.tableGrid}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FDFDFD', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  content: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  backButton: { padding: 12, backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A', textTransform: 'uppercase' },
  scroll: { flex: 1 },
  form: { paddingVertical: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1f2937', marginBottom: 12, textTransform: 'uppercase' },
  personalCard: { backgroundColor: 'white', padding: 20, borderRadius: 24, elevation: 3, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 20 },
  input: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 12, fontWeight: '700', fontSize: 16, marginBottom: 12, color: '#1f2937' },
  deliveryCard: { backgroundColor: 'white', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 20 },
  distanceInfo: { padding: 12, borderRadius: 12, marginBottom: 12 },
  distanceOk: { backgroundColor: '#F0FFF4', borderWidth: 1, borderColor: '#C6F6D5' },
  distanceTooFar: { backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FED7D7' },
  addressText: { color: '#1f2937', fontWeight: '700', fontSize: 14 },
  distanceText: { fontWeight: '900', fontSize: 13, marginTop: 4 },
  distanceTextOk: { color: '#2F855A' },
  distanceTextFar: { color: '#C53030' },
  locationButton: { backgroundColor: MAIN_RED, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  locationButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  tableCard: { backgroundColor: 'white', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 20 },
  tableTitle: { fontSize: 14, fontWeight: '900', color: '#1f2937', marginBottom: 10 },
  tableSelectorButton: { backgroundColor: MAIN_RED, padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tableSelectorText: { fontWeight: '700', color: '#FFFFFF' },
  paymentCard: { backgroundColor: 'white', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 20 },
  paymentOptions: { flexDirection: 'row', gap: 10 },
  paymentOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
  paymentOptionText: { fontWeight: '700' },
  footer: { padding: 20, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
  totalsSection: { marginBottom: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalLabel: { color: '#9CA3AF', fontWeight: 'bold', fontSize: 12 },
  totalValue: { fontWeight: 'bold' },
  deliveryValue: { color: MAIN_RED, fontWeight: 'bold' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  grandTotalLabel: { fontWeight: '900', fontSize: 18 }, 
  grandTotalValue: { color: MAIN_RED, fontWeight: '900', fontSize: 26 },
  confirmButton: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  confirmText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: '60%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  tableNumberButton: { flex: 1, aspectRatio: 1, margin: 5, backgroundColor: MAIN_RED, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tableNumberText: { color: '#FFFFFF', fontWeight: '900', fontSize: 18 },
  tableGrid: { paddingBottom: 20 }
})

export default CheckoutScreen;