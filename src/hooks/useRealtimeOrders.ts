import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// ==================== NEW ORDER STATUS VALUES ====================
export type OrderStatus =
	| 'new'
	| 'accepted'
	| 'preparing'
	| 'ready'
	| 'on_the_way'
	| 'delivered'
	| 'cancelled'

// ==================== ORDER ITEMS INTERFACE ====================
export interface OrderItem {
	id: string
	order_id: string
	menu_item_id: string
	quantity: number
	unit_price: number
	created_at: string
}

// ==================== MENU ITEM WITH CATEGORY ====================
export interface MenuItemWithCategory {
	id: string
	name: string
	price: number
	category_id: string
	category_name?: string
	image_url: string
	available_on_mobile: boolean
	is_available: boolean
	created_at: string
}

// ==================== ORDER WITH ITEMS ====================
export interface OrderItemJsonb {
	id: string
	name: string
	price: number
	quantity: number
	description?: string
	image?: string
}

export interface OrderWithItems {
	id: string
	created_at: string
	updated_at: string
	status: OrderStatus
	total_amount: number
	order_type: 'delivery' | 'dine-in'
	table_number?: string
	delivery_address?: string
	latitude?: number
	longitude?: number
	customer_name: string
	phone: string
	customer_id?: string
	courier_id?: string
	device_id?: string
	source?: string
	picked_at?: string
	delivered_at?: string
	notes?: string
	payment_method?: string
	items?: OrderItemJsonb[]
	order_items?: OrderItem[]
}

// Legacy alias for backward compatibility
export type Order = OrderWithItems

// ==================== COURIER ASSIGNMENT INTERFACE ====================
export interface CourierAssignment {
	id: string
	order_id: string
	courier_id: string
	status: 'assigned' | 'accepted' | 'on_the_way' | 'delivered' | 'cancelled'
	assigned_at: string
	accepted_at?: string
	picked_at?: string
	delivered_at?: string
}

// ==================== CUSTOM HOOK FOR REALTIME ORDERS ====================
export const useRealtimeOrdersSubscription = (fetchOrders: () => void) => {
	const channelRef = useRef<any>(null)

	useEffect(() => {
		// Fetch initial data
		fetchOrders()

		// Setup realtime subscription for INSERT and UPDATE
		channelRef.current = supabase
			.channel('orders')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'orders' },
				() => {
					console.log('Orders changed, refreshing...')
					fetchOrders()
				},
			)
			.subscribe()

		// Cleanup function
		return () => {
			if (channelRef.current) {
				supabase.removeChannel(channelRef.current)
			}
		}
	}, []) // Empty dependency array to prevent infinite loops

	return { channelRef }
}

// ==================== HELPER: FETCH ORDER ITEMS ====================
export const fetchOrderItems = async (
	orderId: string,
): Promise<OrderItem[]> => {
	try {
		const { data, error } = await supabase
			.from('order_items')
			.select('*')
			.eq('order_id', orderId)

		if (error) throw error
		return data || []
	} catch (error) {
		console.error('Error fetching order items:', error)
		return []
	}
}

// ==================== HELPER: FETCH ORDERS WITH ITEMS ====================
export const fetchOrdersWithItems = async (filters?: {
	deviceId?: string
	source?: string
	status?: OrderStatus[]
}): Promise<OrderWithItems[]> => {
	try {
		let query = supabase.from('orders').select('*')

		if (filters?.deviceId) {
			query = query.eq('device_id', filters.deviceId)
		}

		if (filters?.source) {
			query = query.eq('source', filters.source)
		}

		if (filters?.status && filters.status.length > 0) {
			query = query.in('status', filters.status)
		}

		const { data: orders, error } = await query.order('created_at', {
			ascending: false,
		})

		if (error) throw error
		if (!orders || orders.length === 0) return []

		// Fetch order items for all orders
		const orderIds = orders.map(o => o.id)
		const { data: orderItems } = await supabase
			.from('order_items')
			.select('*')
			.in('order_id', orderIds)

		// Map order items to their orders
		const itemsMap = new Map<string, OrderItem[]>()
		orderItems?.forEach(item => {
			const existing = itemsMap.get(item.order_id) || []
			itemsMap.set(item.order_id, [...existing, item])
		})

		// Combine orders with their items
		return orders.map(order => ({
			...order,
			items: Array.isArray((order as any).items) ? (order as any).items : [],
			order_items: itemsMap.get(order.id) || [],
		}))
	} catch (error) {
		console.error('Error fetching orders with items:', error)
		return []
	}
}

export const useRealtimeOrders = (filters?: {
	status?: OrderStatus[]
	customerId?: string
	courierId?: string
	deviceId?: string
	source?: string
}) => {
	const [orders, setOrders] = useState<OrderWithItems[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		// Initial fetch
		fetchOrders()

		// Setup realtime subscription
		const subscription = supabase
			.channel('orders_channel')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'orders',
				},
				payload => {
					console.log('Realtime order update:', payload)

					if (payload.eventType === 'INSERT') {
						const newOrderRaw = payload.new as OrderWithItems
						const newOrder: OrderWithItems = {
							...newOrderRaw,
							items: Array.isArray((newOrderRaw as any).items)
								? (newOrderRaw as any).items
								: [],
						}
						if (matchesFilters(newOrder, filters)) {
							// Fetch order items for new order
							fetchOrderItems(newOrder.id).then(items => {
								setOrders((prev: OrderWithItems[]) => [
									{ ...newOrder, order_items: items },
									...prev,
								])
							})
						}
					} else if (payload.eventType === 'UPDATE') {
						const updatedRaw = payload.new as OrderWithItems
						setOrders((prev: OrderWithItems[]) =>
							prev.map((order: OrderWithItems) => {
								if (order.id !== updatedRaw.id) return order
								const nextItems = Array.isArray((updatedRaw as any).items)
									? (updatedRaw as any).items
									: Array.isArray((order as any).items)
										? (order as any).items
										: []
								const nextOrderItems = Array.isArray(
									(updatedRaw as any).order_items,
								)
									? (updatedRaw as any).order_items
									: Array.isArray((order as any).order_items)
										? (order as any).order_items
										: []
								return {
									...order,
									...updatedRaw,
									items: nextItems,
									order_items: nextOrderItems,
								}
							}),
						)
					} else if (payload.eventType === 'DELETE') {
						const deletedOrder = payload.old as OrderWithItems
						setOrders((prev: OrderWithItems[]) =>
							prev.filter(
								(order: OrderWithItems) => order.id !== deletedOrder.id,
							),
						)
					}
				},
			)
			.subscribe()

		return () => {
			subscription.unsubscribe()
		}
	}, [
		filters?.status,
		filters?.customerId,
		filters?.courierId,
		filters?.deviceId,
		filters?.source,
	])

	const fetchOrders = async () => {
		setLoading(true)
		try {
			// If no identifying filters, return empty for security
			if (!filters?.deviceId && !filters?.customerId && !filters?.courierId) {
				setOrders([])
				return
			}

			// Use the helper function to fetch orders with items
			const ordersWithItems = await fetchOrdersWithItems({
				deviceId: filters?.deviceId,
				source: filters?.source,
				status: filters?.status,
			})

			// Apply additional filters in memory
			let filteredOrders = ordersWithItems

			if (filters?.customerId) {
				filteredOrders = filteredOrders.filter(
					o => o.customer_id === filters.customerId,
				)
			}

			if (filters?.courierId) {
				filteredOrders = filteredOrders.filter(
					o => o.courier_id === filters.courierId,
				)
			}

			setOrders(filteredOrders)
		} catch (error) {
			console.error('❌ Error in fetchOrders, using fallback:', error)
			setOrders([])
		} finally {
			setLoading(false)
		}
	}

	const matchesFilters = (order: OrderWithItems, filters?: any) => {
		if (filters?.status && !filters.status.includes(order.status)) {
			return false
		}
		if (filters?.customerId && order.customer_id !== filters.customerId) {
			return false
		}
		if (filters?.courierId && order.courier_id !== filters.courierId) {
			return false
		}
		if (filters?.deviceId && order.device_id !== filters.deviceId) {
			return false
		}

		if (filters?.source && order.source !== filters.source) {
			return false
		}

		return true
	}

	return { orders, loading, refetch: fetchOrders }
}
