import { MaterialCommunityIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import Constants from 'expo-constants'
import * as Location from 'expo-location'
import { useMemo, useState } from 'react'
import {
	ActivityIndicator,
	Alert,
	FlatList,
	KeyboardAvoidingView,
	Linking,
	Modal,
	Platform,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native'
import { useCart } from '../context/CartContext'
import { useOrder } from '../context/OrderContext'
import { getOrCreateDeviceId } from '../lib/auth'
import { MAX_DELIVERY_RADIUS_KM } from '../lib/constants'
import { supabase } from '../lib/supabase'
import {
	calculateDeliveryFee,
	calculateDistance,
	formatPrice,
} from '../lib/utils'

const MAIN_RED = '#E63946'

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

	const createPaymentUrl = async (
		orderId: string,
		amount: number,
	): Promise<string | null> => {
		try {
			const functionUrl =
				Constants.expoConfig?.extra
					?.EXPO_PUBLIC_SUPABASE_FUNCTION_CREATE_PAYMENT ||
				process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_CREATE_PAYMENT

			if (!functionUrl) {
				Alert.alert('Xato', "To'lov sozlamalari topilmadi")
				return null
			}

			const appScheme =
				Constants.expoConfig?.extra?.EXPO_PUBLIC_APP_SCHEME ||
				process.env.EXPO_PUBLIC_APP_SCHEME ||
				'afsona'

			const response = await fetch(functionUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					order_id: orderId,
					amount: Math.round(amount * 100),
					return_url: `${appScheme}://payment-success`,
				}),
			})

			if (!response.ok) {
				throw new Error(`HTTP error: ${response.status}`)
			}

			const data = await response.json()

			if (data.success && data.payment_url) {
				return data.payment_url
			} else {
				Alert.alert('Xato', data.error || "To'lov yaratishda xatolik")
				return null
			}
		} catch (err: any) {
			console.error('Payment URL error:', err)
			Alert.alert('Xato', `To\'lov yaratishda xatolik: ${err.message}`)
			return null
		}
	}

	const openPaymentUrl = async (paymentUrl: string): Promise<boolean> => {
		try {
			const canOpen = await Linking.canOpenURL(paymentUrl)
			if (canOpen) {
				await Linking.openURL(paymentUrl)
				return true
			} else {
				Alert.alert('Xato', "Brauzerni ochib bo'lmadi")
				return false
			}
		} catch (err: any) {
			console.error('Open URL error:', err)
			Alert.alert('Xato', `Brauzerni ochishda xatolik: ${err.message}`)
			return false
		}
	}

	const handleClickPayment = async (orderId: string, amount: number) => {
		const paymentUrl = await createPaymentUrl(orderId, amount)
		if (paymentUrl) {
			const opened = await openPaymentUrl(paymentUrl)
			if (opened) {
				clearCart()
				navigation.reset({
					index: 0,
					routes: [
						{ name: 'Main' },
						{
							name: 'PaymentSuccess',
							params: { orderId, amount },
						},
					],
				})
			}
		}
	}

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
			console.log('Location permission status:', status)
			if (status !== 'granted') {
				Alert.alert(
					'Ruxsat kerak',
					'Iltimos, manzilni aniqlash uchun ruxsat bering.',
				)
				setLoadingLocation(false)
				return
			}

			let location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			})
			console.log('Got location:', location.coords)

			const { latitude, longitude } = location.coords
			setCoords({ latitude, longitude })

			const dist = calculateDistance(latitude, longitude)
			console.log('Calculated distance:', dist)
			setDistance(dist)

			try {
				let reverseResult = await Location.reverseGeocodeAsync({
					latitude,
					longitude,
				})
				console.log('Reverse geocode result:', reverseResult)
				if (reverseResult.length > 0) {
					const addr = reverseResult[0]
					const addressString =
						`${addr.city || ''}, ${addr.street || "Nomsiz ko'cha"} ${addr.name || ''}`.trim()
					setAddress(addressString)
				} else {
					setAddress('Manzil aniqlanmadi')
				}
			} catch (geoError) {
				console.log('Reverse geocode failed:', geoError)
				setAddress('Manzil aniqlanmadi')
			}

			if (dist > MAX_DELIVERY_RADIUS_KM) {
				Alert.alert(
					'Masofa uzoq',
					`Masofa ${dist.toFixed(1)} km. Biz ${MAX_DELIVERY_RADIUS_KM} km gacha yetkazamiz.`,
				)
			}
		} catch (error: any) {
			console.error('getCurrentLocation error:', error)
			Alert.alert('Xato', error?.message || "Manzilni aniqlab bo'lmadi.")
		} finally {
			setLoadingLocation(false)
		}
	}

	const handleConfirmOrder = async () => {
		if (!customerName.trim() || customerPhone.length < 13) {
			Alert.alert('Xato', "Ism va to'liq telefon raqamini kiriting")
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
			const deviceId = await getOrCreateDeviceId()

			// Build items array for orders.items jsonb
			const orderItemsPayload = Array.isArray(cartItems)
				? cartItems.map(item => ({
						id: item.id,
						name: item.name,
						price: item.price,
						quantity: item.quantity,
						description: item.description || '',
						image: item.image || '',
					}))
				: []

			// 1. Insert into orders table
			const insertPayload = {
				customer_name: customerName,
				phone: customerPhone,
				order_type: orderType,
				delivery_address: orderType === 'delivery' ? address : null,
				latitude: orderType === 'delivery' ? coords?.latitude : null,
				longitude: orderType === 'delivery' ? coords?.longitude : null,
				device_id: deviceId,
				items: orderItemsPayload,
				total_amount: totals.grandTotal,
				payment_method: paymentMethod,
				status: 'new',
				source: 'mobile_app',
			}
			console.log('[Checkout] Insert payload:', JSON.stringify(insertPayload, null, 2))

			const { data: orderData, error: orderError } = await supabase
				.from('orders')
				.insert([insertPayload])
				.select('*')
				.single()

			if (orderError) {
				console.error('[Checkout] Order insert error:', orderError)
				throw orderError
			}
			if (!orderData?.id) throw new Error('Order ID not returned')

			console.log('[Checkout] ✅ Order inserted:', orderData.id, 'device_id:', orderData.device_id, 'source:', orderData.source, 'status:', orderData.status)

			// 2. Insert into order_items table
			const orderItems = Array.isArray(cartItems)
				? cartItems.map(item => {
						const itemId = String((item as any)?.id ?? '')
						const isUuid =
							/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
								itemId,
							)
						return {
							order_id: orderData.id,
							menu_item_id: isUuid ? itemId : null,
							item_name: item.name,
							quantity: item.quantity,
							unit_price: item.price,
							total_price: item.quantity * item.price,
						}
					})
				: []

			const { error: itemsError } = await supabase
				.from('order_items')
				.insert(orderItems)

			if (itemsError) {
				console.error('Error inserting order items:', itemsError)
				// Don't throw - order is created, items might be handled differently
			}

			await AsyncStorage.setItem('phone', customerPhone)

			if (paymentMethod === 'click') {
				await handleClickPayment(orderData.id, totals.grandTotal)
				return
			}

			clearCart()
			console.log('[Checkout] Navigating to orders with new order:', orderData.id)
			Alert.alert('Rahmat!', 'Buyurtmangiz qabul qilindi ✅', [
				{ text: 'OK', onPress: () => navigation.navigate('Main') },
			])
		} catch (err: any) {
			console.error('Order submission error:', err)
			let errorMessage = 'Tarmoq xatosi yoki serverda muammo.'

			if (err?.message) {
				errorMessage = err.message
			} else if (err?.error) {
				errorMessage = err.error
			}

			Alert.alert('Xato', `Buyurtma yuborishda xatolik: ${errorMessage}`)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			style={styles.screen}
		>
			<StatusBar
				barStyle='dark-content'
				backgroundColor='#FDFDFD'
				translucent
			/>

			<View style={styles.content}>
				<View style={styles.header}>
					<TouchableOpacity
						onPress={() => navigation.goBack()}
						style={styles.backButton}
					>
						<MaterialCommunityIcons
							name='arrow-left'
							size={24}
							color='#1C1917'
						/>
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
										<View
											style={[
												styles.distanceInfo,
												isTooFar ? styles.distanceTooFar : styles.distanceOk,
											]}
										>
											<Text style={styles.addressText}>{address}</Text>
											<Text
												style={[
													styles.distanceText,
													isTooFar
														? styles.distanceTextFar
														: styles.distanceTextOk,
												]}
											>
												📍 Masofa: {distance.toFixed(1)} km{' '}
												{isTooFar && '(Juda uzoq!)'}
											</Text>
										</View>
									)}
									<TouchableOpacity
										onPress={getCurrentLocation}
										disabled={loadingLocation}
										style={styles.locationButton}
									>
										{loadingLocation ? (
											<ActivityIndicator color='#FFFFFF' />
										) : (
											<Text style={styles.locationButtonText}>
												JOYLASHUVNI ANIQLASH
											</Text>
										)}
									</TouchableOpacity>
								</View>
							</>
						) : (
							<View style={styles.tableCard}>
								<Text style={styles.tableTitle}>STOL RAQAMI</Text>
								<TouchableOpacity
									style={styles.tableSelectorButton}
									onPress={() => setShowTableModal(true)}
								>
									<Text style={styles.tableSelectorText}>
										{tableNumber
											? `Stol ${tableNumber}`
											: 'Stol raqamini tanlang'}
									</Text>
									<MaterialCommunityIcons
										name='chevron-down'
										size={24}
										color='#FFFFFF'
									/>
								</TouchableOpacity>
							</View>
						)}

						<Text style={styles.sectionTitle}>To'lov turi</Text>
						<View style={styles.paymentCard}>
							<View style={styles.paymentOptions}>
								{[
									{ key: 'cash', label: 'Naqd pul', icon: 'cash' },
									{ key: 'card', label: 'Karta', icon: 'credit-card' },
									{ key: 'click', label: 'Click', icon: 'cellphone' },
								].map(method => (
									<TouchableOpacity
										key={method.key}
										style={[
											styles.paymentOption,
											{
												backgroundColor:
													paymentMethod === method.key ? MAIN_RED : '#F3F4F6',
											},
										]}
										onPress={() => setPaymentMethod(method.key)}
										activeOpacity={0.8}
									>
										<MaterialCommunityIcons
											name={method.icon as any}
											size={24}
											color={
												paymentMethod === method.key ? '#FFFFFF' : '#9CA3AF'
											}
										/>
										<Text
											style={[
												styles.paymentOptionText,
												{
													color:
														paymentMethod === method.key
															? '#FFFFFF'
															: '#9CA3AF',
												},
											]}
										>
											{method.label}
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
							<Text style={styles.totalValue}>
								{formatPrice(totals.subtotal)}
							</Text>
						</View>
						{orderType === 'delivery' && (
							<View style={styles.totalRow}>
								<Text style={styles.totalLabel}>Yetkazib berish:</Text>
								<Text style={styles.deliveryValue}>
									{distance > 0
										? `+${formatPrice(totals.deliveryFee)}`
										: "0 so'm"}
								</Text>
							</View>
						)}
						<View style={styles.grandTotalRow}>
							<Text style={styles.grandTotalLabel}>JAMI:</Text>
							<Text style={styles.grandTotalValue}>
								{formatPrice(totals.grandTotal)}
							</Text>
						</View>
					</View>

					<TouchableOpacity
						onPress={handleConfirmOrder}
						disabled={
							isSubmitting ||
							(orderType === 'delivery' && (isTooFar || distance === 0))
						}
						style={[
							styles.confirmButton,
							{
								backgroundColor:
									isSubmitting ||
									(orderType === 'delivery' && (isTooFar || distance === 0))
										? '#E5E7EB'
										: MAIN_RED,
							},
						]}
					>
						{isSubmitting ? (
							<ActivityIndicator color='#FFFFFF' />
						) : (
							<Text style={styles.confirmText}>BUYURTMANI TASDIQLASH</Text>
						)}
					</TouchableOpacity>
				</View>
			</View>

			<Modal visible={showTableModal} animationType='slide' transparent={true}>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setShowTableModal(false)}
				>
					<View style={styles.modalContainer}>
						<View style={styles.modalHandle} />
						<Text style={styles.modalTitle}>Stol raqamini tanlang</Text>
						<FlatList
							data={Array.from({ length: 20 }, (_, i) => i + 1)}
							keyExtractor={item => item.toString()}
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
	screen: {
		flex: 1,
		backgroundColor: '#FDFCFB', // Warm cozy light background
		paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
	},
	content: { flex: 1, paddingHorizontal: 20 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 16,
	},
	backButton: {
		padding: 12,
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
		borderColor: '#F5F5F4',
		borderRadius: 18,
		shadowColor: '#1C1917',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.05,
		shadowRadius: 10,
		elevation: 3,
	},
	headerTitle: {
		fontSize: 22,
		fontWeight: '900',
		color: '#1C1917',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	scroll: { flex: 1 },
	form: { paddingVertical: 8, paddingBottom: 40 },
	sectionTitle: {
		fontSize: 16,
		fontWeight: '900',
		color: '#1C1917',
		marginBottom: 16,
		textTransform: 'uppercase',
		letterSpacing: 1.5,
		marginTop: 8,
	},
	personalCard: {
		backgroundColor: '#FFFFFF',
		padding: 24,
		borderRadius: 32,
		shadowColor: '#1C1917',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.04,
		shadowRadius: 15,
		elevation: 5,
		marginBottom: 24,
	},
	input: {
		backgroundColor: '#FAF7F5', // Soft warm input
		padding: 18,
		borderRadius: 16,
		fontWeight: '700',
		fontSize: 16,
		marginBottom: 14,
		color: '#1C1917',
	},
	deliveryCard: {
		backgroundColor: '#FFFFFF',
		padding: 24,
		borderRadius: 32,
		shadowColor: '#1C1917',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.04,
		shadowRadius: 15,
		elevation: 5,
		marginBottom: 24,
	},
	distanceInfo: { padding: 14, borderRadius: 16, marginBottom: 16 },
	distanceOk: {
		backgroundColor: '#F0FDF4', // Light mint
		borderWidth: 1,
		borderColor: '#BBF7D0',
	},
	distanceTooFar: {
		backgroundColor: '#FFF0F0',
		borderWidth: 1,
		borderColor: '#FECDD3',
	},
	addressText: { color: '#1C1917', fontWeight: '800', fontSize: 15 },
	distanceText: { fontWeight: '900', fontSize: 14, marginTop: 4 },
	distanceTextOk: { color: '#16A34A' },
	distanceTextFar: { color: '#E11D48' },
	locationButton: {
		backgroundColor: '#FFF0F0', // Soft appetizing background
		height: 54,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: '#FECDD3',
	},
	locationButtonText: { color: MAIN_RED, fontWeight: '900', fontSize: 15, letterSpacing: 1 },
	tableCard: {
		backgroundColor: '#FFFFFF',
		padding: 24,
		borderRadius: 32,
		shadowColor: '#1C1917',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.04,
		shadowRadius: 15,
		elevation: 5,
		marginBottom: 24,
	},
	tableTitle: {
		fontSize: 14,
		fontWeight: '900',
		color: '#78716C',
		marginBottom: 10,
	},
	tableSelectorButton: {
		backgroundColor: MAIN_RED,
		padding: 18,
		borderRadius: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		shadowColor: MAIN_RED,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.25,
		shadowRadius: 12,
		elevation: 8,
	},
	tableSelectorText: { fontWeight: '900', color: '#FFFFFF', fontSize: 16 },
	paymentCard: {
		backgroundColor: '#FFFFFF',
		padding: 24,
		borderRadius: 32,
		shadowColor: '#1C1917',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.04,
		shadowRadius: 15,
		elevation: 5,
		marginBottom: 24,
	},
	paymentOptions: { flexDirection: 'row', gap: 12 },
	paymentOption: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		padding: 16,
		borderRadius: 16,
	},
	paymentOptionText: { fontWeight: '800', fontSize: 14 },
	footer: {
		paddingHorizontal: 20,
		paddingBottom: 20,
		backgroundColor: 'transparent',
	},
	totalsSection: { 
		backgroundColor: '#FFFFFF',
		padding: 24,
		borderRadius: 32,
		shadowColor: '#1C1917',
		shadowOffset: { width: 0, height: -10 },
		shadowOpacity: 0.06,
		shadowRadius: 30,
		elevation: 15,
		marginBottom: 12,
	},
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	totalLabel: { color: '#78716C', fontWeight: 'bold', fontSize: 14 },
	totalValue: { fontWeight: '800', fontSize: 15, color: '#1C1917' },
	deliveryValue: { color: MAIN_RED, fontWeight: '800', fontSize: 15 },
	grandTotalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 12,
		paddingTop: 16,
		borderTopWidth: 1.5,
		borderTopColor: '#F5F5F4',
	},
	grandTotalLabel: { fontWeight: '900', fontSize: 18, color: '#1C1917' },
	grandTotalValue: { color: MAIN_RED, fontWeight: '900', fontSize: 26 },
	confirmButton: {
		height: 64,
		borderRadius: 32,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: MAIN_RED,
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
		elevation: 10,
	},
	confirmText: { color: '#FFFFFF', fontWeight: '900', fontSize: 18, letterSpacing: 1.5 },
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(28,25,23,0.6)', // Warm dark blur
		justifyContent: 'flex-end',
	},
	modalContainer: {
		backgroundColor: '#FFFFFF',
		borderTopLeftRadius: 40,
		borderTopRightRadius: 40,
		padding: 24,
		maxHeight: '60%',
	},
	modalHandle: {
		width: 48,
		height: 6,
		backgroundColor: '#E7E5E4',
		borderRadius: 3,
		alignSelf: 'center',
		marginBottom: 24,
	},
	modalTitle: {
		fontSize: 22,
		fontWeight: '900',
		textAlign: 'center',
		marginBottom: 24,
		color: '#1C1917'
	},
	tableNumberButton: {
		flex: 1,
		aspectRatio: 1,
		margin: 6,
		backgroundColor: '#FAF7F5',
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	tableNumberText: { color: '#1C1917', fontWeight: '900', fontSize: 20 },
	tableGrid: { paddingBottom: 24 },
});

export default CheckoutScreen
