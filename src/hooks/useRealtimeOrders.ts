import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type OrderStatus =
	| 'new'
	| 'accepted'
	| 'preparing'
	| 'ready'
	| 'on_the_way'
	| 'delivered'
	| 'cancelled'

export interface OrderItem {
	id: string
	order_id: string
	menu_item_id: string
	quantity: number
	unit_price: number
	created_at: string
}

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

export type Order = OrderWithItems

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

export const fetchOrderItems = async (orderId: string): Promise<OrderItem[]> => {
	try {
		const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId)
		if (error) throw error
		return data || []
	} catch (error) {
		console.error('Error fetching order items:', error)
		return []
	}
}

export const fetchOrdersWithItems = async (filters?: {
	deviceId?: string
	source?: string
	status?: OrderStatus[]
}): Promise<OrderWithItems[]> => {
	try {
		let query = supabase.from('orders').select('*')
		if (filters?.deviceId) query = query.eq('device_id', filters.deviceId)
		if (filters?.source) query = query.eq('source', filters.source)
		if (filters?.status && filters.status.length > 0) query = query.in('status', filters.status)

		const { data: orders, error } = await query.order('created_at', { ascending: false })
		if (error) throw error
		if (!orders || orders.length === 0) return []

		const orderIds = orders.map(o => o.id)
		const { data: orderItems } = await supabase.from('order_items').select('*').in('order_id', orderIds)

		const itemsMap = new Map<string, OrderItem[]>()
		orderItems?.forEach(item => {
			const existing = itemsMap.get(item.order_id) || []
			itemsMap.set(item.order_id, [...existing, item])
		})

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

const orderMatchesFilters = (order: OrderWithItems, f?: {
	status?: OrderStatus[]
	customerId?: string
	courierId?: string
	deviceId?: string
	source?: string
}) => {
	if (f?.status && !f.status.includes(order.status)) return false
	if (f?.customerId && order.customer_id !== f.customerId) return false
	if (f?.courierId && order.courier_id !== f.courierId) return false
	if (f?.deviceId && order.device_id !== f.deviceId) return false
	if (f?.source && order.source !== f.source) return false
	return true
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
	const filtersRef = useRef(filters)
	const channelRef = useRef<any>(null)

	// Keep latest filters in ref for realtime handler
	useEffect(() => {
		filtersRef.current = filters
	}, [filters])

	// Stable fetch — reads from ref, no deps to avoid recreation
	const fetchOrders = useCallback(async () => {
		const f = filtersRef.current
		setLoading(true)
		try {
			if (!f?.deviceId && !f?.customerId && !f?.courierId) {
				setOrders([])
				return
			}
			const result = await fetchOrdersWithItems({
				deviceId: f?.deviceId,
				source: f?.source,
				status: f?.status,
			})
			let filtered = result
			if (f?.customerId) filtered = filtered.filter(o => o.customer_id === f.customerId)
			if (f?.courierId) filtered = filtered.filter(o => o.courier_id === f.courierId)
			setOrders(filtered)
		} catch (error) {
			console.error('❌ Error in fetchOrders:', error)
			setOrders([])
		} finally {
			setLoading(false)
		}
	}, [])

	// Setup realtime subscription ONCE — stable channel name, empty deps
	useEffect(() => {
		const channel = supabase
			.channel('orders_rt_user')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'orders' },
				async payload => {
					const f = filtersRef.current
					if (payload.eventType === 'INSERT') {
						const raw = payload.new as OrderWithItems
						const order: OrderWithItems = {
							...raw,
							items: Array.isArray((raw as any).items) ? (raw as any).items : [],
						}
						if (orderMatchesFilters(order, f)) {
							const items = await fetchOrderItems(order.id)
							setOrders(prev => {
								if (prev.some(o => o.id === order.id)) return prev
								return [{ ...order, order_items: items }, ...prev]
							})
						}
					} else if (payload.eventType === 'UPDATE') {
						const raw = payload.new as OrderWithItems
						const include = orderMatchesFilters(raw, f)
						setOrders(prev => {
							const exists = prev.some(o => o.id === raw.id)
							if (exists && include) {
								return prev.map(o => {
									if (o.id !== raw.id) return o
									return {
										...o,
										...raw,
										items: Array.isArray((raw as any).items) ? (raw as any).items : o.items,
										order_items: Array.isArray((raw as any).order_items) ? (raw as any).order_items : o.order_items,
									}
								})
							}
							if (exists && !include) return prev.filter(o => o.id !== raw.id)
							if (!exists && include) return [raw, ...prev]
							return prev
						})
					} else if (payload.eventType === 'DELETE') {
						const id = (payload.old as any).id
						setOrders(prev => prev.filter(o => o.id !== id))
					}
				},
			)
			.subscribe()

		channelRef.current = channel
		return () => {
			supabase.removeChannel(channel)
		}
	}, [])

	// Fetch when filters become available (initial load only)
	useEffect(() => {
		const f = filters
		if (!f?.deviceId && !f?.customerId && !f?.courierId) return
		fetchOrders()
	}, [fetchOrders, filters?.deviceId, filters?.customerId, filters?.courierId])

	return { orders, loading, refetch: fetchOrders }
}
