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

					{/* Timeline */}
					<View style={styles.timelineRow}>
						{steps.map((step, idx) => (
							<View key={step.id} style={styles.stepCol}>
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
										size={14}
										color={idx <= currentStepIndex ? '#FFF' : '#9CA3AF'}
									/>
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
	container: { flex: 1, backgroundColor: '#F9FAFB' },

	// Map
	mapWrapper: {
		height: SCREEN_HEIGHT * 0.6,
		width: '100%',
		backgroundColor: '#E5E7EB',
	},
	map: { flex: 1 },
	dineInFull: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		backgroundColor: '#F9FAFB',
	},
	dineInLabel: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
	dineInNumber: { fontSize: 64, fontWeight: '900', color: '#111827' },

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
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 6,
	},

	// Bottom Sheet
	sheet: {
		flex: 1,
		backgroundColor: '#FFF',
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		marginTop: -28,
		paddingHorizontal: 20,
		paddingTop: 24,
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 12,
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
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
	},
	badgeText: { fontSize: 13, fontWeight: '700' },
	eta: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
	liveText: { fontSize: 16, fontWeight: '700', color: '#111827' },

	// Courier
	courierRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 14,
		backgroundColor: '#F9FAFB',
		borderRadius: 16,
	},
	courierAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#FF0000',
		alignItems: 'center',
		justifyContent: 'center',
	},
	courierName: { fontSize: 15, fontWeight: '700', color: '#111827' },
	courierSub: { fontSize: 12, color: '#6B7280' },

	// Timeline
	timelineRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		position: 'relative',
	},
	stepCol: { alignItems: 'center', flex: 1, position: 'relative' },
	stepDot: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 2,
	},
	dotActive: { backgroundColor: '#FF0000' },
	dotInactive: { backgroundColor: '#E5E7EB' },
	stepLabel: {
		fontSize: 9,
		marginTop: 6,
		fontWeight: '700',
		textAlign: 'center',
	},
	labelActive: { color: '#111827' },
	labelInactive: { color: '#9CA3AF' },
	stepLine: {
		position: 'absolute',
		top: 16,
		left: '50%',
		width: '100%',
		height: 2,
		zIndex: 1,
	},
	lineActive: { backgroundColor: '#FF0000' },
	lineInactive: { backgroundColor: '#E5E7EB' },

	// Info
	infoCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 10,
		padding: 14,
		backgroundColor: '#F9FAFB',
		borderRadius: 14,
	},
	infoText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },

	// Items
	itemsCard: {
		backgroundColor: '#F9FAFB',
		borderRadius: 16,
		padding: 16,
		gap: 10,
	},
	sectionTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 4,
	},
	itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	itemQty: { fontSize: 14, fontWeight: '800', color: '#FF0000', width: 24 },
	itemName: { flex: 1, fontSize: 14, color: '#374151' },
	itemPrice: { fontSize: 14, fontWeight: '700', color: '#111827' },
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		borderTopWidth: 1,
		borderTopColor: '#E5E7EB',
		paddingTop: 12,
		marginTop: 4,
	},
	totalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
	totalValue: { fontSize: 18, fontWeight: '900', color: '#FF0000' },
})

export default UserOrderDetailScreen
