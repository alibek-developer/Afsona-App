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

const MAIN_RED = '#FF0000'

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
				activeOpacity={0.9}
			>
				<View style={styles.cardHeader}>
					<View style={styles.idContainer}>
						<View style={styles.orderIconBox}>
							<MaterialCommunityIcons
								name={status.icon as any}
								size={18}
								color={status.color}
							/>
						</View>
						<View>
							<Text style={styles.orderId}>
								#{item.id?.slice(0, 8).toUpperCase() || 'UNKN'}
							</Text>
							<Text style={styles.timeText}>
								{date}, {time}
							</Text>
						</View>
					</View>

					<View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
						<View
							style={[styles.statusDot, { backgroundColor: status.color }]}
						/>
						<Text style={[styles.statusText, { color: status.color }]}>
							{status.label}
						</Text>
					</View>
				</View>

				<View style={styles.divider} />

				<View style={styles.customerBox}>
					<View style={[styles.avatar, { backgroundColor: MAIN_RED + '15' }]}>
						<Text style={[styles.avatarText, { color: MAIN_RED }]}>
							{item.customer_name ? item.customer_name[0].toUpperCase() : '?'}
						</Text>
					</View>

					<View style={styles.customerDetails}>
						<Text style={styles.customerName}>
							{item.customer_name || "Noma'lum"}
						</Text>
						<Text style={styles.customerPhone}>{item.phone || ''}</Text>
					</View>

					<View style={styles.typeBadge}>
						<Text style={styles.typeText}>
							{item.order_type === 'delivery' ? '🛵 Yetkazish' : '🍽️ Zal'}
						</Text>
					</View>
				</View>

				{item.delivery_address ? (
					<View style={styles.tableIndicator}>
						<MaterialCommunityIcons
							name='map-marker'
							size={12}
							color={MAIN_RED}
						/>
						<Text style={styles.tableText} numberOfLines={1}>
							{item.delivery_address}
						</Text>
					</View>
				) : null}

				<View style={styles.itemsList}>
					{items.slice(0, 3).map((food: any, index: number) => (
						<View key={index} style={styles.foodRow}>
							<View style={styles.qtyBox}>
								<Text style={styles.qtyText}>{food.quantity || 1}x</Text>
							</View>
							<Text style={styles.foodName} numberOfLines={1}>
								{food.name || food.item_name || `Mahsulot #${index + 1}`}
							</Text>
						</View>
					))}

					{items.length > 3 ? (
						<Text style={styles.moreItems}>
							+{items.length - 3} ta mahsulot
						</Text>
					) : null}
				</View>

				<View style={styles.cardFooter}>
					<Text style={styles.totalLabel}>Jami</Text>
					<Text style={styles.totalPrice}>
						{(item.total_amount || 0).toLocaleString('uz-UZ')} so'm
					</Text>
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
	safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
	header: {
		paddingHorizontal: 20,
		backgroundColor: '#FFF',
		borderBottomLeftRadius: 30,
		borderBottomRightRadius: 30,
		elevation: 4,
		shadowColor: MAIN_RED,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 10,
	},
	headerTop: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
	},
	headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
	headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
	deviceIdText: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
	container: { flex: 1 },
	listContent: { padding: 16, paddingBottom: 40 },
	card: {
		backgroundColor: '#FFF',
		borderRadius: 24,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#F3F4F6',
		elevation: 2,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	idContainer: { flexDirection: 'row', alignItems: 'center' },
	orderIconBox: {
		width: 32,
		height: 32,
		backgroundColor: MAIN_RED + '10',
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 10,
	},
	orderId: { fontSize: 14, fontWeight: '700', color: '#111827' },
	timeText: { fontSize: 11, color: '#9CA3AF' },
	statusBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 10,
	},
	statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
	statusText: { fontSize: 11, fontWeight: '700' },
	divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
	customerBox: { flexDirection: 'row', alignItems: 'center' },
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	avatarText: { fontSize: 16, fontWeight: 'bold' },
	customerDetails: { flex: 1, marginLeft: 12 },
	customerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
	customerPhone: { fontSize: 12, color: '#6B7280' },
	typeBadge: {
		backgroundColor: '#F9FAFB',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	typeText: { fontSize: 10, color: '#374151', fontWeight: '700' },
	tableIndicator: {
		marginTop: 10,
		backgroundColor: MAIN_RED + '08',
		padding: 6,
		borderRadius: 8,
		alignSelf: 'flex-start',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	tableText: { fontSize: 11, color: MAIN_RED, fontWeight: '700' },
	itemsList: { marginTop: 12 },
	foodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
	qtyBox: {
		backgroundColor: '#F3F4F6',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		marginRight: 10,
	},
	qtyText: { fontSize: 11, fontWeight: '700', color: '#4B5563' },
	foodName: { fontSize: 13, color: '#374151', fontWeight: '500', flex: 1 },
	moreItems: {
		fontSize: 11,
		color: '#9CA3AF',
		fontStyle: 'italic',
		marginTop: 4,
	},
	cardFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 12,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: '#F3F4F6',
	},
	totalLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
	totalPrice: { fontSize: 16, fontWeight: '800', color: MAIN_RED },
	center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	emptyBox: { marginTop: 80, alignItems: 'center' },
	emptyText: { color: '#9CA3AF', fontSize: 14, marginTop: 10 },
})

export default OrdersScreen
