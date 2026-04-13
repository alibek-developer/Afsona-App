import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useEffect, useRef, useState } from 'react'
import {
	Animated,
	Dimensions,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Order } from '../hooks/useRealtimeOrders'
import { supabase } from '../lib/supabase'

const MAIN_RED = '#FF4747'

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

// --- Status Config ---
const STATUS_CONFIG: Record<
	string,
	{ label: string; color: string; bg: string; icon: string; liveText: string }
> = {
	new: {
		label: 'Yangi',
		color: '#D97706',
		bg: '#FEF3C7',
		icon: 'clock-outline',
		liveText: 'Buyurtma qabul qilindi...',
	},
	accepted: {
		label: 'Qabul qilindi',
		color: '#3B82F6',
		bg: '#EFF6FF',
		icon: 'check-circle-outline',
		liveText: 'Buyurtma tasdiqlandi',
	},
	preparing: {
		label: 'Tayyorlanmoqda',
		color: '#D97706',
		bg: '#FEF3C7',
		icon: 'chef-hat',
		liveText: 'Oshxonada tayyorlanmoqda...',
	},
	ready: {
		label: 'Tayyor',
		color: '#7C3AED',
		bg: '#EDE9FE',
		icon: 'package-variant',
		liveText: 'Buyurtma tayyor, kuryer kutilmoqda',
	},
	on_the_way: {
		label: "Yo'lda",
		color: '#FF0000',
		bg: '#FFE4E4',
		icon: 'motorbike',
		liveText: "Kuryer yo'lda",
	},
	delivered: {
		label: 'Yetkazildi',
		color: '#059669',
		bg: '#D1FAE5',
		icon: 'check-all',
		liveText: 'Buyurtma yetkazildi ✓',
	},
	cancelled: {
		label: 'Bekor qilindi',
		color: '#EF4444',
		bg: '#FEE2E2',
		icon: 'close-circle-outline',
		liveText: 'Buyurtma bekor qilindi',
	},
}

const DEFAULT_STATUS_CFG = {
	label: 'Yangi',
	color: '#FF0000',
	bg: '#FFF5F5',
	icon: 'clock-outline',
	liveText: 'Buyurtma qabul qilindi',
}

// Coords type used for courier location state
type LatLng = { latitude: number; longitude: number }

const UserOrderDetailScreen = () => {
	const navigation = useNavigation<any>()
	const route = useRoute()
	const { order: initialOrder } = route.params as { order: Order }
	const [order, setOrder] = useState<Order>(initialOrder)
	// Dedicated state for courier live location — updated via two channels below
	const [courierLocation, setCourierLocation] = useState<LatLng | null>(() => {
		const o = initialOrder as any
		if (o.courier_latitude && o.courier_longitude) {
			return { latitude: o.courier_latitude, longitude: o.courier_longitude }
		}
		return null
	})
	const insets = useSafeAreaInsets()
	const mapRef = useRef<MapView>(null)

	const statusKey = ((order as any)?.status || 'new').toString().toLowerCase()
	const statusCfg = STATUS_CONFIG[statusKey] ?? DEFAULT_STATUS_CFG

	const safeItems = Array.isArray(order.order_items)
		? order.order_items
		: Array.isArray(order.items)
			? order.items
			: []

	// Timeline steps
	const steps = [
		{ id: 'new', label: 'Yangi', icon: 'clock-outline' },
		{ id: 'preparing', label: 'Tayyorlanmoqda', icon: 'chef-hat' },
		{ id: 'on_the_way', label: "Yo'lda", icon: 'motorbike' },
		{ id: 'delivered', label: 'Yetkazildi', icon: 'check-all' },
	]

	const currentStepIndex = (() => {
		const s = order.status
		if (s === 'delivered') return 3
		if (s === 'on_the_way') return 2
		if (s === 'preparing' || s === 'ready') return 1
		return 0
	})()

	// ── Channel 1: orders table — picks up status, courier_id, and coords stored on order row
	useEffect(() => {
		const channel = supabase
			.channel(`order-detail-${order.id}`)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'orders',
					filter: `id=eq.${order.id}`,
				},
				payload => {
					const updated = payload.new as any
					setOrder(prev => {
						const nextItems = Array.isArray(updated?.items)
							? updated.items
							: Array.isArray((prev as any)?.items)
								? (prev as any).items
								: []
						const nextOrderItems = Array.isArray(updated?.order_items)
							? updated.order_items
							: Array.isArray((prev as any)?.order_items)
								? (prev as any).order_items
								: []
						return {
							...prev,
							...updated,
							items: nextItems,
							order_items: nextOrderItems,
						} as Order
					})
					// If the order row carries courier coords (e.g. courier_latitude / courier_longitude columns)
					if (updated.courier_latitude && updated.courier_longitude) {
						setCourierLocation({
							latitude: updated.courier_latitude,
							longitude: updated.courier_longitude,
						})
					}
				},
			)
			.subscribe()
		return () => {
			supabase.removeChannel(channel)
		}
	}, [order.id])

	// ── Channel 2: courier_locations table — dedicated high-frequency location updates
	// This channel activates only when a courier has been assigned (courier_id exists)
	// and the order is in transit. It listens to a separate table that the courier
	// device writes to via useCourierTracking hook.
	useEffect(() => {
		const courierId = (order as any).courier_id
		if (!courierId) return // no courier assigned yet — skip subscription

		const locationChannel = supabase
			.channel(`courier-location-${courierId}-${order.id}`)
			.on(
				'postgres_changes',
				{
					event: '*', // INSERT or UPDATE
					schema: 'public',
					table: 'courier_locations',
					filter: `courier_id=eq.${courierId}`,
				},
				payload => {
					const loc = payload.new as any
					if (loc?.latitude && loc?.longitude) {
						setCourierLocation({
							latitude: loc.latitude,
							longitude: loc.longitude,
						})
					}
				},
			)
			.subscribe()

		return () => {
			supabase.removeChannel(locationChannel)
		}
	}, [(order as any).courier_id])

	// ── Derived coords
	const deliveryCoords: LatLng | null =
		order.latitude && order.longitude
			? { latitude: order.latitude, longitude: order.longitude }
			: null

	// Courier marker is ONLY visible when status === 'on_the_way' AND coords exist
	const showCourierMarker =
		order.status === 'on_the_way' && courierLocation !== null

	const courierCoords: LatLng | null = showCourierMarker
		? courierLocation
		: null

	// ── Auto-fit map whenever relevant coords change
	useEffect(() => {
		if (!mapRef.current) return
		const coords = [deliveryCoords, courierCoords].filter(Boolean) as LatLng[]
		if (coords.length >= 2) {
			mapRef.current.fitToCoordinates(coords, {
				edgePadding: { top: 120, right: 60, bottom: 260, left: 60 },
				animated: true,
			})
		} else if (coords.length === 1) {
			mapRef.current.fitToCoordinates(coords, {
				edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
				animated: true,
			})
		}
	}, [order.status, courierLocation?.latitude, courierLocation?.longitude])

	return (
		<View style={styles.container}>
			{/* ── MAP 60% ── */}
			<View style={styles.mapWrapper}>
				{order.order_type === 'delivery' && deliveryCoords ? (
					<MapView
						ref={mapRef}
						style={styles.map}
						rotateEnabled={false}
						initialRegion={{
							...deliveryCoords,
							latitudeDelta: 0.01,
							longitudeDelta: 0.01,
						}}
					>
						<Marker coordinate={deliveryCoords} anchor={{ x: 0.5, y: 0.5 }}>
							<PulseMarker />
						</Marker>

						{courierCoords && (
							<Marker coordinate={courierCoords} anchor={{ x: 0.5, y: 0.5 }}>
								<BounceMarker />
							</Marker>
						)}
					</MapView>
				) : order.order_type === 'dine-in' ? (
					<View style={styles.dineInFull}>
						<MaterialCommunityIcons
							name='silverware-fork-knife'
							size={56}
							color='#FF0000'
						/>
						<Text style={styles.dineInLabel}>Stol raqami</Text>
						<Text style={styles.dineInNumber}>{order.table_number || '—'}</Text>
					</View>
				) : null}

				{/* Floating Back */}
				<TouchableOpacity
					style={[styles.floatingBack, { top: insets.top + 10 }]}
					onPress={() => navigation.goBack()}
				>
					<MaterialCommunityIcons name='arrow-left' size={22} color='#111827' />
				</TouchableOpacity>
			</View>

			{/* ── BOTTOM SHEET ── */}
			<View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ gap: 16 }}
				>
					{/* Status Badge + Live Text */}
					<View style={styles.statusRow}>
						<View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
							<MaterialCommunityIcons
								name={statusCfg.icon as any}
								size={16}
								color={statusCfg.color}
							/>
							<Text style={[styles.badgeText, { color: statusCfg.color }]}>
								{statusCfg.label}
							</Text>
						</View>
						{order.status === 'on_the_way' && (
							<Text style={styles.eta}>~20 daqiqa</Text>
						)}
					</View>

					<Text style={styles.liveText}>{statusCfg.liveText}</Text>

					{/* Courier info */}
					{(order as any).courier_name && (
						<View style={styles.courierRow}>
							<View style={styles.courierAvatar}>
								<MaterialCommunityIcons name='account' size={20} color='#FFF' />
							</View>
							<View>
								<Text style={styles.courierName}>
									{(order as any).courier_name}
								</Text>
								<Text style={styles.courierSub}>Kuryer</Text>
							</View>
						</View>
					)}

					{/* Timeline (Vertical Creative) */}
					<View style={styles.timelineRow}>
						{steps.map((step, idx) => (
							<View key={step.id} style={styles.stepCol}>
								<View style={styles.stepIconWrapper}>
									<View
										style={[
											styles.stepDot,
											idx <= currentStepIndex
												? styles.dotActive
												: styles.dotInactive,
										]}
									>
										<MaterialCommunityIcons
											name={step.icon as any}
											size={20}
											color={idx <= currentStepIndex ? '#FFFFFF' : '#A8A29E'}
										/>
									</View>
									{idx < steps.length - 1 && (
										<View
											style={[
												styles.stepLine,
												idx < currentStepIndex
													? styles.lineActive
													: styles.lineInactive,
											]}
										/>
									)}
								</View>
								<Text
									style={[
										styles.stepLabel,
										idx <= currentStepIndex
											? styles.labelActive
											: styles.labelInactive,
									]}
								>
									{step.label}
								</Text>
							</View>
						))}
					</View>

					{/* Address */}
					{order.order_type === 'delivery' &&
						(order as any).delivery_address && (
							<View style={styles.infoCard}>
								<MaterialCommunityIcons
									name='map-marker-outline'
									size={20}
									color='#6B7280'
								/>
								<Text style={styles.infoText}>
									{(order as any).delivery_address}
								</Text>
							</View>
						)}

					{/* Order Items */}
					<View style={styles.itemsCard}>
						<Text style={styles.sectionTitle}>Buyurtma tarkibi</Text>
						{safeItems.map((item: any, idx: number) => (
							<View key={idx} style={styles.itemRow}>
								<Text style={styles.itemQty}>{item.quantity || 1}×</Text>
								<Text style={styles.itemName}>
									{item.name || `Mahsulot #${idx + 1}`}
								</Text>
								<Text style={styles.itemPrice}>
									{(
										(item.unit_price || item.price || 0) *
											(item.quantity || 1) || 0
									).toLocaleString()}{' '}
									so'm
								</Text>
							</View>
						))}
						<View style={styles.totalRow}>
							<Text style={styles.totalLabel}>Jami</Text>
							<Text style={styles.totalValue}>
								{(order.total_amount || 0).toLocaleString()} so'm
							</Text>
						</View>
					</View>
				</ScrollView>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#FDFCFB' },

	// Map
	mapWrapper: {
		height: SCREEN_HEIGHT * 0.6,
		width: '100%',
		backgroundColor: '#FAF7F5',
	},
	map: { flex: 1 },
	dineInFull: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		backgroundColor: '#FDFCFB',
	},
	dineInLabel: { fontSize: 17, color: '#78716C', fontWeight: '700' },
	dineInNumber: { fontSize: 72, fontWeight: '900', color: '#1C1917' },

	floatingBack: {
		position: 'absolute',
		left: 20,
		width: 46,
		height: 46,
		borderRadius: 23,
		backgroundColor: '#FFFFFF',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#1C1917',
		shadowOpacity: 0.08,
		shadowRadius: 15,
		shadowOffset: { width: 0, height: 6 },
		elevation: 6,
	},

	// Bottom Sheet
	sheet: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		borderTopLeftRadius: 36,
		borderTopRightRadius: 36,
		marginTop: -32,
		paddingHorizontal: 24,
		paddingTop: 30,
		shadowColor: '#1C1917',
		shadowOpacity: 0.05,
		shadowRadius: 20,
		shadowOffset: { width: 0, height: -10 },
		elevation: 10,
	},

	// Status
	statusRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	badge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 20,
	},
	badgeText: { fontSize: 13, fontWeight: '800' },
	eta: { fontSize: 14, color: '#78716C', fontWeight: '700' },
	liveText: { fontSize: 18, fontWeight: '900', color: '#1C1917', letterSpacing: 0.5 },

	// Courier
	courierRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 14,
		padding: 16,
		backgroundColor: '#FAF7F5',
		borderRadius: 20,
	},
	courierAvatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: MAIN_RED,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: MAIN_RED,
		shadowOpacity: 0.3,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
	},
	courierName: { fontSize: 16, fontWeight: '800', color: '#1C1917' },
	courierSub: { fontSize: 13, color: '#78716C', fontWeight: '600' },

	// Timeline (Vertical)
	timelineRow: {
		flexDirection: 'column',
		position: 'relative',
		marginTop: 8,
		backgroundColor: '#FFFFFF',
		padding: 24,
		borderRadius: 32, // Very rounded
		shadowColor: '#1C1917',
		shadowOpacity: 0.03,
		shadowRadius: 15,
		shadowOffset: { width: 0, height: 6 },
		elevation: 3,
		borderWidth: 1,
		borderColor: '#F5F5F4',
	},
	stepCol: { 
		flexDirection: 'row', 
		alignItems: 'center', 
		gap: 20, 
		height: 60,
	},
	stepIconWrapper: {
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center',
		height: '100%',
		width: 48,
	},
	stepDot: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 2,
		shadowColor: MAIN_RED,
		shadowOpacity: 0.2,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
	},
	dotActive: { backgroundColor: MAIN_RED },
	dotInactive: { backgroundColor: '#F5F5F4', shadowOpacity: 0 },
	stepLabel: {
		fontSize: 16,
		fontWeight: '900',
	},
	labelActive: { color: '#1C1917' },
	labelInactive: { color: '#A8A29E' },
	stepLine: {
		position: 'absolute',
		top: 48, // starts below the dot
		left: 23,
		width: 3,
		height: 32, // spans to next dot
		zIndex: 1,
		borderRadius: 2,
	},
	lineActive: { backgroundColor: MAIN_RED },
	lineInactive: { backgroundColor: '#F5F5F4' },

	// Info
	infoCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
		padding: 18,
		backgroundColor: '#FAF7F5',
		borderRadius: 20,
	},
	infoText: { flex: 1, fontSize: 14, color: '#44403C', lineHeight: 22, fontWeight: '600' },

	// Items
	itemsCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 28,
		padding: 24,
		gap: 12,
		shadowColor: '#1C1917',
		shadowOpacity: 0.04,
		shadowRadius: 20,
		shadowOffset: { width: 0, height: 8 },
		elevation: 4,
		borderWidth: 1,
		borderColor: '#F5F5F4',
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '900',
		color: '#1C1917',
		marginBottom: 8,
		letterSpacing: 0.5,
	},
	itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
	itemQty: { fontSize: 15, fontWeight: '900', color: MAIN_RED, width: 28 },
	itemName: { flex: 1, fontSize: 15, color: '#44403C', fontWeight: '600' },
	itemPrice: { fontSize: 15, fontWeight: '800', color: '#1C1917' },
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		borderTopWidth: 1.5,
		borderTopColor: '#F5F5F4',
		paddingTop: 16,
		marginTop: 8,
	},
	totalLabel: { fontSize: 18, fontWeight: '900', color: '#1C1917' },
	totalValue: { fontSize: 20, fontWeight: '900', color: MAIN_RED },
})

export default UserOrderDetailScreen
