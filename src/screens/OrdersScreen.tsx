import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	ActivityIndicator,
	FlatList,
	Platform,
	RefreshControl,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useOrderStatusNotifications } from '../hooks/useOrderNotifications'
import {
	Order,
	OrderStatus,
	useRealtimeOrders,
} from '../hooks/useRealtimeOrders'
import { getOrCreateDeviceId } from '../lib/auth'

const MAIN_RED = '#FF4747'

const OrdersScreen = () => {
	const navigation = useNavigation<any>()
	const insets = useSafeAreaInsets()
	const [deviceId, setDeviceId] = useState<string>('')
	const [refreshing, setRefreshing] = useState(false)

	useEffect(() => {
		let mounted = true

		;(async () => {
			try {
				const id = await getOrCreateDeviceId()
				if (mounted) setDeviceId(id)
			} catch (error) {
				console.error('Device ID olishda xatolik:', error)
			}
		})()

		return () => {
			mounted = false
		}
	}, [])

	// Faqat shu telefonning device id siga tegishli orderlar olinadi
	const { orders, loading, refetch } = useRealtimeOrders(
		deviceId
			? {
					deviceId,
					source: 'mobile_app',
				}
			: undefined,
	)

	const safeOrders = useMemo(
		() => (Array.isArray(orders) ? orders : []),
		[orders],
	)

	useOrderStatusNotifications(safeOrders)

	const onRefresh = useCallback(() => {
		setRefreshing(true)
		Promise.resolve(refetch()).finally(() => setRefreshing(false))
	}, [refetch])

	const getStatusInfo = (status: OrderStatus) => {
		const s = status?.toLowerCase() || 'new'

		if (s === 'new') {
			return {
				color: '#FF0000',
				label: 'Yangi',
				bg: '#FFF5F5',
				icon: 'clock-outline',
			}
		}
		if (s === 'accepted') {
			return {
				color: '#3B82F6',
				label: 'Qabul qilindi',
				bg: '#EFF6FF',
				icon: 'check-circle-outline',
			}
		}
		if (s === 'preparing') {
			return {
				color: '#F59E0B',
				label: 'Tayyorlanmoqda',
				bg: '#FFFBEB',
				icon: 'chef-hat',
			}
		}
		if (s === 'ready') {
			return {
				color: '#10B981',
				label: 'Tayyor',
				bg: '#ECFDF5',
				icon: 'package-variant-closed',
			}
		}
		if (s === 'on_the_way') {
			return {
				color: '#8B5CF6',
				label: 'Yetkazilmoqda',
				bg: '#F5F3FF',
				icon: 'truck-delivery',
			}
		}
		if (s === 'delivered') {
			return {
				color: '#6B7280',
				label: 'Yetkazildi',
				bg: '#F3F4F6',
				icon: 'check-all',
			}
		}
		if (s === 'cancelled') {
			return {
				color: '#EF4444',
				label: 'Bekor qilindi',
				bg: '#FEE2E2',
				icon: 'close-circle-outline',
			}
		}

		return {
			color: '#6B7280',
			label: status || 'Noma’lum',
			bg: '#F3F4F6',
			icon: 'help-circle-outline',
		}
	}

	const renderOrderItem = ({ item }: { item: Order }) => {
		const status = getStatusInfo(item.status)

		const time = item.created_at
			? new Date(item.created_at).toLocaleTimeString('uz-UZ', {
					hour: '2-digit',
					minute: '2-digit',
				})
			: '00:00'

		const date = item.created_at
			? new Date(item.created_at).toLocaleDateString('uz-UZ', {
					day: '2-digit',
					month: '2-digit',
				})
			: '00.00'

		const items = Array.isArray(item.order_items)
			? item.order_items
			: Array.isArray(item.items)
				? item.items
				: []

		return (
			<TouchableOpacity
				style={styles.card}
				onPress={() => navigation.navigate('UserOrderDetail', { order: item })}
				activeOpacity={0.8}
			>
				{/* The colored left strip indicating status visually clearly */}
				<View style={[styles.statusStrip, { backgroundColor: status.color }]} />

				<View style={styles.cardInner}>
					{/* Top Header */}
					<View style={styles.cardHeaderRow}>
						<View>
							<Text style={styles.orderIdTitle}>Buyurtma</Text>
							<Text style={styles.orderId}>
								#{item.id?.slice(0, 6).toUpperCase() || 'UNKN'}
							</Text>
						</View>
						<View style={styles.dateCol}>
							<MaterialCommunityIcons name='calendar-blank' size={14} color='#A8A29E' />
							<Text style={styles.dateText}>{date}  {time}</Text>
						</View>
					</View>

					<View style={styles.dividerDashed} />

					{/* Customer & Status Section */}
					<View style={styles.middleSection}>
						<View style={[styles.grandBadge, { backgroundColor: status.bg }]}>
							<View style={[styles.iconCircle, { backgroundColor: status.color + '20' }]}>
								<MaterialCommunityIcons name={status.icon as any} size={22} color={status.color} />
							</View>
							<View>
								<Text style={[styles.grandBadgeTitle, { color: status.color }]}>Holati:</Text>
								<Text style={[styles.grandBadgeText, { color: status.color }]}>{status.label}</Text>
							</View>
						</View>

						<View style={styles.customerBrief}>
							<MaterialCommunityIcons name={item.order_type === 'delivery' ? 'moped' : 'storefront-outline'} size={24} color='#1C1917' />
							<Text style={styles.customerName} numberOfLines={1}>{item.customer_name || 'Mijoz'}</Text>
						</View>
					</View>

					{/* Items Summary Pill list */}
					<View style={styles.fancyItemsWrapper}>
						{items.slice(0, 2).map((food: any, index: number) => (
							<View key={index} style={styles.itemPill}>
								<Text style={styles.itemPillQty}>{food.quantity || 1}×</Text>
								<Text style={styles.itemPillName} numberOfLines={1}>
									{food.name || food.item_name || `Mahsulot`}
								</Text>
							</View>
						))}
						{items.length > 2 && (
							<View style={[styles.itemPill, { backgroundColor: '#F5F5F4' }]}>
								<Text style={styles.morePillText}>+{items.length - 2}</Text>
							</View>
						)}
					</View>

					{/* Card Footer: Price */}
					<View style={styles.creativeFooter}>
						<Text style={styles.footerLabel}>Umumiy narx</Text>
						<View style={styles.priceTag}>
							<Text style={styles.priceTagText}>
								{(item.total_amount || 0).toLocaleString('uz-UZ')} so'm
							</Text>
						</View>
					</View>
				</View>
			</TouchableOpacity>
		)
	}

	return (
		<View style={styles.safeArea}>
			<StatusBar barStyle='dark-content' backgroundColor='white' />

			<View
				style={[
					styles.header,
					{
						paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 10),
						height: 75 + insets.top,
					},
				]}
			>
				<View style={styles.headerTop}>
					<View>
						<Text style={styles.headerTitle}>Mening buyurtmalarim</Text>
						<Text style={styles.deviceIdText}>
							ID: {deviceId || 'Loading...'}
						</Text>
					</View>
				</View>
			</View>

			<View style={styles.container}>
				{loading && !refreshing ? (
					<View style={styles.center}>
						<ActivityIndicator size='large' color={MAIN_RED} />
					</View>
				) : (
					<FlatList
						data={safeOrders}
						keyExtractor={(item, index) => item.id || `order-${index}`}
						renderItem={renderOrderItem}
						contentContainerStyle={styles.listContent}
						showsVerticalScrollIndicator={false}
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={onRefresh}
								colors={[MAIN_RED]}
							/>
						}
						ListEmptyComponent={
							<View style={styles.emptyBox}>
								<MaterialCommunityIcons
									name='receipt-text-outline'
									size={60}
									color='#CCC'
								/>
								<Text style={styles.emptyText}>
									Sizda hali buyurtmalar yo&apos;q
								</Text>
							</View>
						}
					/>
				)}
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: '#FAF8F5' }, // Very warm background
	header: {
		paddingHorizontal: 24,
		backgroundColor: '#FFFFFF',
		borderBottomLeftRadius: 40,
		borderBottomRightRadius: 40,
		elevation: 12,
		shadowColor: '#1C1917',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.05,
		shadowRadius: 20,
	},
	headerTop: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 10,
	},
	headerTitle: { fontSize: 26, fontWeight: '900', color: '#1C1917', letterSpacing: -0.5 },
	headerSubtitle: { fontSize: 14, color: '#78716C', marginTop: 2, fontWeight: '500' },
	deviceIdText: { fontSize: 11, color: '#D6D3D1', marginTop: 6, fontStyle: 'italic' },
	container: { flex: 1 },
	listContent: { padding: 20, paddingBottom: 40, gap: 20 },
	
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 24,
		flexDirection: 'row',
		overflow: 'hidden',
		shadowColor: '#1C1917',
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.06,
		shadowRadius: 25,
		elevation: 6,
		borderWidth: 1,
		borderColor: 'rgba(0,0,0,0.02)',
	},
	statusStrip: {
		width: 10,
		height: '100%',
	},
	cardInner: {
		flex: 1,
		padding: 20,
	},
	cardHeaderRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
	},
	orderIdTitle: { fontSize: 11, fontWeight: '800', color: '#A8A29E', textTransform: 'uppercase', letterSpacing: 1 },
	orderId: { fontSize: 20, fontWeight: '900', color: '#1C1917', marginTop: 2 },
	dateCol: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FAF7F5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
	dateText: { fontSize: 12, color: '#78716C', fontWeight: '700' },
	
	dividerDashed: { height: 1, backgroundColor: '#E7E5E4', marginVertical: 18 },
	
	middleSection: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 12,
	},
	grandBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingRight: 16,
		paddingVertical: 6,
		paddingLeft: 6,
		borderRadius: 100, // Pill shape
		gap: 10,
		flex: 1,
	},
	iconCircle: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
	},
	grandBadgeTitle: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
	grandBadgeText: { fontSize: 14, fontWeight: '900' },

	customerBrief: {
		alignItems: 'center',
		paddingHorizontal: 12,
		maxWidth: '35%',
	},
	customerName: { fontSize: 12, fontWeight: '800', color: '#44403C', marginTop: 4, textAlign: 'center' },

	fancyItemsWrapper: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginTop: 18,
	},
	itemPill: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFF0F0',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 12,
		gap: 6,
		maxWidth: '100%',
	},
	itemPillQty: { fontSize: 13, fontWeight: '900', color: MAIN_RED },
	itemPillName: { fontSize: 13, fontWeight: '700', color: '#44403C', maxWidth: 120 },
	morePillText: { fontSize: 13, fontWeight: '800', color: '#A8A29E' },

	creativeFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 20,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: '#F5F5F4',
		borderStyle: 'dashed', // Creative touch
	},
	footerLabel: { fontSize: 14, color: '#78716C', fontWeight: '800' },
	priceTag: {
		backgroundColor: MAIN_RED,
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 16,
		shadowColor: MAIN_RED,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 4,
	},
	priceTagText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },

	center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	emptyBox: { marginTop: 80, alignItems: 'center' },
	emptyText: { color: '#A8A29E', fontSize: 16, marginTop: 14, fontWeight: '800' },
})

export default OrdersScreen
