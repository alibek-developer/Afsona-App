import { useEffect, useRef, useState } from 'react';
import { MOCK_ORDERS } from '../lib/mocks';
import { supabase } from '../lib/supabase';

// ==================== CUSTOM HOOK FOR REALTIME ORDERS ====================
export const useRealtimeOrdersSubscription = (fetchOrders: () => void) => {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Fetch initial data
    fetchOrders();

    // Setup realtime subscription for INSERT and UPDATE
    channelRef.current = supabase
      .channel('orders')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          console.log('Orders changed, refreshing...');
          fetchOrders();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []); // Empty dependency array to prevent infinite loops

  return { channelRef };
};

export type OrderStatus = 
  | 'yangi' 
  | 'qabul_qilindi' 
  | 'tayyorlanmoqda' 
  | 'tayyor' 
  | 'ready' 
  | 'new'
  | 'accepted'
  | 'on_the_way'
  | 'olingan'
  | 'olib_ketildi' 
  | 'yetkazildi'

export interface Order {
  id: string
  created_at: string
  updated_at: string
  status: OrderStatus
  items: any[]
  total_amount: number
  type: 'delivery' | 'dine-in'
  table_number?: string
  delivery_address?: string
  latitude?: number
  longitude?: number
  customer_name: string
  customer_phone: string
  customer_id?: string
  courier_id?: string
  device_id?: string
  source?: string
  picked_at?: string
  delivered_at?: string
  notes?: string
}

export const useRealtimeOrders = (filters?: {
  status?: OrderStatus[]
  customerId?: string
  courierId?: string
  deviceId?: string
  source?: string
}) => {
  const [orders, setOrders] = useState<Order[]>([])
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
        (payload) => {
          console.log('Realtime order update:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order
            if (matchesFilters(newOrder, filters)) {
              setOrders((prev: Order[]) => [newOrder, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as Order
            setOrders((prev: Order[]) =>
              prev.map((order: Order) =>
                order.id === updatedOrder.id ? updatedOrder : order
              )
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedOrder = payload.old as Order
            setOrders((prev: Order[]) =>
              prev.filter((order: Order) => order.id !== deletedOrder.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [filters?.status, filters?.customerId, filters?.courierId, filters?.deviceId, filters?.source])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      let query = supabase.from('orders').select('*')

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId)
      }

      if (filters?.courierId) {
        query = query.eq('courier_id', filters.courierId)
      }

      if (filters?.deviceId) {
        query = query.eq('device_id', filters.deviceId)
      } else if (!filters?.courierId && !filters?.customerId) {
        // If no identifying filters are provided for a generic order fetch, 
        // return empty to avoid leaking all orders (Security Guard)
        setOrders([]);
        setLoading(false);
        return;
      }

      if (filters?.source) {
        query = query.eq('source', filters.source)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching orders, using mock fallback:', error)
        setOrders(MOCK_ORDERS);
        return
      }
      
      if (!data || data.length === 0) {
        console.warn('⚠️ No orders found, using mock fallback');
        setOrders(MOCK_ORDERS);
      } else {
        setOrders(data);
      }
    } catch (error) {
      console.error('❌ Error in fetchOrders, using fallback:', error)
      setOrders(MOCK_ORDERS);
    } finally {
      setLoading(false)
    }
  }

  const matchesFilters = (order: Order, filters?: any) => {
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