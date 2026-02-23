import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import {
	Alert,
	Animated,
	Dimensions,
	Linking,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCourierTracking } from '../hooks/useCourierTracking'
import { supabase } from '../lib/supabase'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// --- Animated Pulse Marker (Customer / Home) ---
const PulseMarker = () => {
	const pulse = useRef(new Animated.Value(1)).current

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(pulse, {
					toValue: 1.35,
					duration: 800,
					useNativeDriver: true,
				}),
				Animated.timing(pulse, {
					toValue: 1,
					duration: 800,
					useNativeDriver: true,
				}),
			]),
		).start()
	}, [])

	return (
		<View style={markerStyles.wrapper}>
			<Animated.View
				style={[markerStyles.pulse, { transform: [{ scale: pulse }] }]}
			/>
			<View style={markerStyles.customerDot}>
				<MaterialCommunityIcons name='home' size={18} color='#FFF' />
			</View>
		</View>
	)
}

// --- Bounce Marker (Courier / Motorbike) ---
const BounceMarker = () => {
	const bounce = useRef(new Animated.Value(0)).current

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(bounce, {
					toValue: -6,
					duration: 400,
					useNativeDriver: true,
				}),
				Animated.timing(bounce, {
					toValue: 0,
					duration: 400,
					useNativeDriver: true,
				}),
			]),
		).start()
	}, [])

	return (
		<Animated.View
			style={[markerStyles.courierDot, { transform: [{ translateY: bounce }] }]}
		>
			<MaterialCommunityIcons name='motorbike' size={18} color='#FFF' />
		</Animated.View>
	)
}

const markerStyles = StyleSheet.create({
	wrapper: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 56,
		height: 56,
	},
	pulse: {
		position: 'absolute',
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: 'rgba(16,185,129,0.25)',
	},
	customerDot: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: '#10B981',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#10B981',
		shadowOpacity: 0.5,
		shadowRadius: 6,
		elevation: 6,
	},
	courierDot: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: '#FF0000',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#FF0000',
		shadowOpacity: 0.5,
		shadowRadius: 6,
		elevation: 6,
	},
})

// ─── Main Screen ───────────────────────────────────────────────────────────────

const CourierOrderDetailScreen = () => {
	const navigation = useNavigation<any>()
	const route = useRoute()
	const insets = useSafeAreaInsets()
	const { order: initialOrder, currentCourierId } = route.params as any
	const [order, setOrder] = useState(initialOrder)
	const [isUpdating, setIsUpdating] = useState(false)
	const mapRef = useRef<MapView>(null)

	const isAccepted =
		order.status === 'on_the_way' && order.courier_id === currentCourierId
	const canAccept = order.status === 'ready' && !order.courier_id
	const isDelivered = order.status === 'yetkazildi'

	// Live Location Tracking Hook (only if accepted)
	const { location } = useCourierTracking(order.id, isAccepted)

	const deliveryCoords =
		order.latitude && order.longitude
			? { latitude: order.latitude, longitude: order.longitude }
			: null

	const courierCoords = location?.coords
		? {
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
			}
		: null

	// Auto-fit map when both markers exist
	useEffect(() => {
		if (!mapRef.current) return
		const coords = [deliveryCoords, courierCoords].filter(Boolean) as {
			latitude: number
			longitude: number
		}[]
		if (coords.length >= 2) {
			mapRef.current.fitToCoordinates(coords, {
				edgePadding: { top: 120, right: 60, bottom: 260, left: 60 },
				animated: true,
			})
		} else if (deliveryCoords) {
			mapRef.current.fitToCoordinates([deliveryCoords], {
				edgePadding: { top: 100, right: 60, bottom: 180, left: 60 },
				animated: true,
			})
		}
	}, [location?.coords?.latitude, location?.coords?.longitude])

	const handleAccept = async () => {
		setIsUpdating(true)
		const { error } = await supabase
			.from('orders')
			.update({
				status: 'on_the_way',
				courier_id: currentCourierId,
				picked_at: new Date().toISOString(),
			})
			.eq('id', order.id)

		if (error) {
			Alert.alert('Xatolik', 'Qabul qilishda xato')
		} else {
			setOrder({ ...order, status: 'on_the_way', courier_id: currentCourierId })
		}
		setIsUpdating(false)
	}

	const handleDelivered = async () => {
		setIsUpdating(true)
		const { error } = await supabase
			.from('orders')
			.update({
				status: 'yetkazildi',
				delivered_at: new Date().toISOString(),
			})
			.eq('id', order.id)

		if (error) {
			Alert.alert('Xatolik', 'Xatolik yuz berdi')
		} else {
			setOrder({ ...order, status: 'yetkazildi' })
		}
		setIsUpdating(false)
	}

	const handleCall = () => {
		if (order.customer_phone) {
			Linking.openURL(`tel:${order.customer_phone}`)
		}
	}

	return (
		<View style={styles.container}>
			<StatusBar style='dark' />

			{/* ── MAP 70% ── */}
			<View style={styles.mapWrapper}>
				<MapView
					ref={mapRef}
					style={styles.map}
					rotateEnabled={false}
					showsUserLocation={false}
					initialRegion={
						deliveryCoords
							? {
									...deliveryCoords,
									latitudeDelta: 0.05,
									longitudeDelta: 0.05,
								}
							: undefined
					}
				>
					{deliveryCoords && (
						<Marker coordinate={deliveryCoords} anchor={{ x: 0.5, y: 0.5 }}>
							<PulseMarker />
						</Marker>
					)}

					{courierCoords && isAccepted && (
						<Marker coordinate={courierCoords} anchor={{ x: 0.5, y: 0.5 }}>
							<BounceMarker />
						</Marker>
					)}
				</MapView>

				{/* Floating Back */}
				<TouchableOpacity
					style={[styles.floatingBack, { top: insets.top + 10 }]}
					onPress={() => navigation.goBack()}
				>
					<MaterialCommunityIcons name='arrow-left' size={22} color='#111827' />
				</TouchableOpacity>

				{/* Map Legend (only if courier marker visible) */}
				{courierCoords && isAccepted && (
					<View style={styles.legend}>
						<View style={styles.legendItem}>
							<View
								style={[styles.legendDot, { backgroundColor: '#10B981' }]}
							/>
							<Text style={styles.legendText}>Mijoz</Text>
						</View>
						<View style={styles.legendItem}>
							<View
								style={[styles.legendDot, { backgroundColor: '#FF0000' }]}
							/>
							<Text style={styles.legendText}>Siz</Text>
						</View>
					</View>
				)}
			</View>

			{/* ── BOTTOM CARD ── */}
			<View style={[styles.card, { paddingBottom: insets.bottom + 20 }]}>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ gap: 14 }}
				>
					{/* Header Row */}
					<View style={styles.cardHeader}>
						<View style={{ flex: 1 }}>
							<Text style={styles.customerName}>{order.customer_name}</Text>
							<Text style={styles.customerPhone}>{order.customer_phone}</Text>
						</View>
						{order.customer_phone && (
							<TouchableOpacity style={styles.callBtn} onPress={handleCall}>
								<MaterialCommunityIcons name='phone' size={20} color='#FFF' />
							</TouchableOpacity>
						)}
					</View>

					{/* Address */}
					<View style={styles.addressCard}>
						<MaterialCommunityIcons
							name='map-marker'
							size={18}
							color='#FF0000'
						/>
						<Text style={styles.addressText} numberOfLines={2}>
							{order.type === 'delivery'
								? order.delivery_address
								: `Stol: ${order.table_number}`}
						</Text>
					</View>

					{/* ── ORDER ITEMS ── */}
					{order.items && order.items.length > 0 && (
						<View style={styles.itemsCard}>
							<Text style={styles.itemsTitle}>Buyurtma tarkibi:</Text>
							{order.items.map((item: any, idx: number) => (
								<View key={idx} style={styles.itemRow}>
									<Text style={styles.itemName} numberOfLines={1}>
										{item.name}
									</Text>
									<Text style={styles.itemMeta}>
										x{item.quantity}
										{'  '}
										<Text style={styles.itemPrice}>
											{(item.price * item.quantity).toLocaleString()} so'm
										</Text>
									</Text>
								</View>
							))}
							<View style={styles.itemsDivider} />
							<View style={styles.itemsTotalRow}>
								<Text style={styles.itemsTotalLabel}>Jami</Text>
								<Text style={styles.itemsTotalValue}>
									{order.total_amount?.toLocaleString()} so'm
								</Text>
							</View>
						</View>
					)}

					{/* Price + Action */}
					<View style={styles.actionRow}>
						<View>
							<Text style={styles.priceLabel}>Summa</Text>
							<Text style={styles.price}>
								{order.total_amount?.toLocaleString()} so'm
							</Text>
						</View>

						{canAccept && (
							<TouchableOpacity
								style={[
									styles.actionBtn,
									styles.btnAccept,
									isUpdating && styles.btnDisabled,
								]}
								onPress={handleAccept}
								disabled={isUpdating}
								activeOpacity={0.85}
							>
								<MaterialCommunityIcons
									name='check-circle'
									size={20}
									color='#FFF'
								/>
								<Text style={styles.actionBtnText}>Qabul qilish</Text>
							</TouchableOpacity>
						)}

						{isAccepted && (
							<TouchableOpacity
								style={[
									styles.actionBtn,
									styles.btnDeliver,
									isUpdating && styles.btnDisabled,
								]}
								onPress={handleDelivered}
								disabled={isUpdating}
								activeOpacity={0.85}
							>
								<MaterialCommunityIcons
									name='package-variant-closed-check'
									size={20}
									color='#FFF'
								/>
								<Text style={styles.actionBtnText}>Yetkazildi</Text>
							</TouchableOpacity>
						)}

						{isDelivered && (
							<View style={styles.deliveredBadge}>
								<MaterialCommunityIcons
									name='check-all'
									size={18}
									color='#10B981'
								/>
								<Text style={styles.deliveredText}>Yetkazildi</Text>
							</View>
						)}
					</View>
				</ScrollView>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#111827' },

	// Map
	mapWrapper: { height: SCREEN_HEIGHT * 0.7, width: '100%' },
	map: { flex: 1 },

	floatingBack: {
		position: 'absolute',
		left: 16,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: '#FFF',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 8,
	},

	legend: {
		position: 'absolute',
		bottom: 48,
		right: 16,
		backgroundColor: 'rgba(255,255,255,0.95)',
		borderRadius: 12,
		padding: 10,
		gap: 6,
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowRadius: 6,
		elevation: 4,
	},
	legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	legendDot: { width: 10, height: 10, borderRadius: 5 },
	legendText: { fontSize: 12, fontWeight: '600', color: '#374151' },

	// Card
	card: {
		flex: 1,
		backgroundColor: '#FFF',
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		marginTop: -28,
		paddingHorizontal: 20,
		paddingTop: 24,
		gap: 16,
		shadowColor: '#000',
		shadowOpacity: 0.12,
		shadowRadius: 16,
		elevation: 14,
	},

	cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	customerName: { fontSize: 20, fontWeight: '800', color: '#111827' },
	customerPhone: { fontSize: 14, color: '#6B7280', marginTop: 2 },
	callBtn: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: '#10B981',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#10B981',
		shadowOpacity: 0.4,
		shadowRadius: 8,
		elevation: 6,
	},

	addressCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 10,
		backgroundColor: '#FFF5F5',
		padding: 14,
		borderRadius: 14,
	},
	addressText: {
		flex: 1,
		fontSize: 14,
		color: '#374151',
		lineHeight: 20,
		fontWeight: '500',
	},

	// Items section
	itemsCard: {
		backgroundColor: '#F9FAFB',
		borderRadius: 14,
		padding: 14,
		gap: 8,
	},
	itemsTitle: {
		fontSize: 13,
		fontWeight: '700',
		color: '#6B7280',
		marginBottom: 2,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	itemRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 8,
	},
	itemName: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '500' },
	itemMeta: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
	itemPrice: { color: '#111827', fontWeight: '700' },
	itemsDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
	itemsTotalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	itemsTotalLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
	itemsTotalValue: { fontSize: 15, fontWeight: '900', color: '#FF0000' },

	actionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 4,
	},
	priceLabel: {
		fontSize: 12,
		color: '#9CA3AF',
		fontWeight: '600',
		marginBottom: 2,
	},
	price: { fontSize: 24, fontWeight: '900', color: '#111827' },

	actionBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 24,
		paddingVertical: 14,
		borderRadius: 18,
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 6,
	},
	btnAccept: {
		backgroundColor: '#10B981',
		shadowColor: '#10B981',
	},
	btnDeliver: {
		backgroundColor: '#FF0000',
		shadowColor: '#FF0000',
	},
	btnDisabled: { opacity: 0.6 },
	actionBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

	deliveredBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		backgroundColor: '#D1FAE5',
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 14,
	},
	deliveredText: { color: '#10B981', fontWeight: '700', fontSize: 15 },
})

export default CourierOrderDetailScreen
