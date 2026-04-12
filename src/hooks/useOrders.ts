import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { OrderWithItems, OrderStatus } from '../hooks/useRealtimeOrders'
import { supabase } from '../lib/supabase'

export interface CourierOrderGroups {
  ready: OrderWithItems[]
  accepted: OrderWithItems[]
  onTheWay: OrderWithItems[]
}

export interface CourierEarnings {
  todayTotal: number
  todayCount: number
  weekTotal: number
  weekCount: number
  totalDelivered: number
  totalEarnings: number
}

export const useOrders = () => {
  const { user } = useAuth()
  const currentCourierId = user?.id || ''
  
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [initialLoading, setInitialLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // Refs to prevent subscription recreation and request loops
  const channelRef = useRef<any>(null)
  const currentCourierIdRef = useRef(currentCourierId)
  const initialFetchDone = useRef(false)

  // Always keep latest courierId in ref for realtime handler
  useEffect(() => {
    currentCourierIdRef.current = currentCourierId
  }, [currentCourierId])

  const fetchOrders = useCallback(async () => {
    const cid = currentCourierIdRef.current
    if (!cid) return
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['ready', 'accepted', 'on_the_way'] as OrderStatus[])
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map(o => o.id)
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds)

        const itemsMap = new Map<string, any[]>()
        itemsData?.forEach(item => {
          const existing = itemsMap.get(item.order_id) || []
          itemsMap.set(item.order_id, [...existing, item])
        })

        const ordersWithItems = ordersData.map(order => ({
          ...order,
          order_items: itemsMap.get(order.id) || [],
        }))

        setOrders(ordersWithItems)
      } else {
        setOrders([])
      }
    } catch (err: any) {
      console.error('[useOrders] Orders fetch error:', err)
      setError(err.message || 'Network error occurred')
      setOrders([])
    } finally {
      if (!initialFetchDone.current) {
        setInitialLoading(false)
        initialFetchDone.current = true
      }
    }
  }, [])

  // Initial fetch when courierId becomes available
  useEffect(() => {
    if (!currentCourierId) {
      setInitialLoading(false)
      return
    }
    fetchOrders()
  }, [currentCourierId, fetchOrders])

  // Setup realtime subscription ONCE — empty deps, uses refs for latest values
  useEffect(() => {
    const channel = supabase
      .channel('courier_orders_rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as OrderWithItems
            if (['ready', 'accepted', 'on_the_way'].includes(newOrder.status)) {
              const { data: items } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', newOrder.id)
              
              setOrders((prev) => {
                if (prev.some(o => o.id === newOrder.id)) return prev
                return [{ ...newOrder, order_items: items || [] }, ...prev]
              })
            }
          } 
          else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as OrderWithItems
            setOrders((prev) => {
              if (!['ready', 'accepted', 'on_the_way'].includes(updatedOrder.status)) {
                return prev.filter(o => o.id !== updatedOrder.id)
              }
              const exists = prev.some(o => o.id === updatedOrder.id)
              if (exists) {
                return prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o)
              } else {
                return [updatedOrder, ...prev]
              }
            })
          } 
          else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const groupedOrders: CourierOrderGroups = {
    ready: orders.filter(o => o.status === 'ready'),
    accepted: orders.filter(o => o.status === 'accepted'),
    onTheWay: orders.filter(o => o.status === 'on_the_way'),
  }

  const myActiveOrders = orders.filter(
    o => o.courier_id === currentCourierId && ['accepted', 'on_the_way'].includes(o.status)
  )

  return {
    orders,
    setOrders,
    groupedOrders,
    myActiveOrders,
    initialLoading,
    error,
    fetchOrders,
    currentCourierId
  }
}

export const acceptOrder = async (orderId: string, courierId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Step 1: Update order status from 'ready' to 'accepted' and assign courier
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'accepted',
        courier_id: courierId,
      })
      .eq('id', orderId)
      .eq('status', 'ready')

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return { success: false, error: 'Buyurtma allaqachon boshqa kuryer tomonidan qabul qilingan' }
      }
      throw orderError
    }

    // Step 2: Upsert courier_assignments (idempotent on order_id)
    // Note: courier_profiles must already exist for this courier
    const { error: assignmentError } = await supabase
      .from('courier_assignments')
      .upsert({
        order_id: orderId,
        courier_id: courierId,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      }, { onConflict: 'order_id' })

    if (assignmentError) {
      console.error('[acceptOrder] Assignment error (courier_profiles may not exist):', assignmentError)
    }

    return { success: true }
  } catch (err: any) {
    console.error('[acceptOrder] Error:', err)
    return { success: false, error: err.message }
  }
}

export const deliverOrder = async (orderId: string, courierId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('courier_id', courierId)

    if (orderError) throw orderError

    const { error: assignmentError } = await supabase
      .from('courier_assignments')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .eq('courier_id', courierId)

    if (assignmentError) {
      console.error('[deliverOrder] Assignment error:', assignmentError)
    }

    return { success: true }
  } catch (err: any) {
    console.error('[deliverOrder] Error:', err)
    return { success: false, error: err.message }
  }
}

export const fetchCourierEarnings = async (courierId: string): Promise<CourierEarnings> => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    const { data: deliveredOrders, error } = await supabase
      .from('orders')
      .select('id, total_amount, delivered_at, customer_name, delivery_address')
      .eq('courier_id', courierId)
      .eq('status', 'delivered')
      .gte('delivered_at', weekStart.toISOString())
      .order('delivered_at', { ascending: false })

    if (error) throw error

    let todayTotal = 0
    let todayCount = 0
    let weekTotal = 0
    let weekCount = 0

    deliveredOrders?.forEach(order => {
      const amount = Number(order.total_amount) || 0
      const deliveredDate = new Date(order.delivered_at)
      if (deliveredDate >= today) { todayTotal += amount; todayCount++ }
      if (deliveredDate >= weekStart) { weekTotal += amount; weekCount++ }
    })

    return {
      todayTotal, todayCount, weekTotal, weekCount,
      totalDelivered: deliveredOrders?.length || 0,
      totalEarnings: deliveredOrders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0,
    }
  } catch (err) {
    console.error('[fetchCourierEarnings] Error:', err)
    return { todayTotal: 0, todayCount: 0, weekTotal: 0, weekCount: 0, totalDelivered: 0, totalEarnings: 0 }
  }
}
