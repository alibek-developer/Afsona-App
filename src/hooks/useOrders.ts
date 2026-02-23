import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Order } from '../hooks/useRealtimeOrders'
import { getOrCreateDeviceId } from '../lib/auth'
import { supabase } from '../lib/supabase'

// ==================== CUSTOM HOOK FOR ORDERS ====================
export const useOrders = () => {
  const { user } = useAuth();
  const currentCourierId = user?.id || '';
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Initialize device ID
  useEffect(() => {
    const initializeDeviceId = async () => {
      const id = await getOrCreateDeviceId();
      setDeviceId(id);
    };

    initializeDeviceId();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Courier filtering: delivery orders with status IN ('ready','on_the_way'), valid coordinates
      // Courier should see 'delivery' type orders with ready/on_the_way status
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('type', 'delivery')
        .in('status', ['ready', 'on_the_way'])
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        console.log(
          '[useOrders] Fetched orders:',
          data.map((o) => ({ id: o.id, status: o.status, type: o.type }))
        );
        setOrders(data);
      } else {
        setOrders([]);
      }

    } catch (err: any) {
      console.error('[useOrders] Orders fetch error:', err);
      setError(err.message || 'Network error occurred');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchOrders();

    // ==================== REALTIME SUBSCRIPTION ====================
    // Create subscription with granular state updates for ALL delivery orders
    const channel = supabase
      .channel('courier_orders_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log(`[useOrders] Realtime event: ${payload.eventType}`, payload);

          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            
            // Only add if type is 'delivery', status is 'ready' or 'on_the_way', and has valid coordinates
            if (newOrder.type === 'delivery' && ['ready', 'on_the_way'].includes(newOrder.status) && newOrder.latitude !== null && newOrder.longitude !== null) {
              setOrders((prev) => {
                const alreadyExists = prev.some(o => o.id === newOrder.id);
                if (alreadyExists) return prev;
                return [newOrder, ...prev];
              });
              console.log('[useOrders] New ready delivery order added to list');
            }
          } 
          else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as Order;

            // OPTIMISTIC UPDATE: Update only the specific order in state
            setOrders((prev) => {
              const exists = prev.some(o => o.id === updatedOrder.id);
              
              if (updatedOrder.type !== 'delivery') {
                // If it's not a delivery order, remove it
                if (exists) {
                  console.log('[useOrders] Non-delivery order removed from list');
                  return prev.filter(o => o.id !== updatedOrder.id);
                }
                return prev;
              }

              if (!['ready', 'on_the_way'].includes(updatedOrder.status)) {
                // If status is not 'ready' or 'on_the_way', remove it
                if (exists) {
                  console.log('[useOrders] Order with non-courier status removed from list');
                  return prev.filter(o => o.id !== updatedOrder.id);
                }
                return prev;
              }

              if (updatedOrder.latitude === null || updatedOrder.longitude === null) {
                // If coordinates are missing, remove it
                if (exists) {
                  console.log('[useOrders] Order with missing coordinates removed from list');
                  return prev.filter(o => o.id !== updatedOrder.id);
                }
                return prev;
              }

              // Update the order in the list
              if (exists) {
                console.log('[useOrders] Updating order in list');
                return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
              } else {
                console.log('[useOrders] Adding order to list via update');
                return [updatedOrder, ...prev];
              }
            });
          } 
          else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('[useOrders] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array to prevent re-subscription

  return {
    orders,
    loading,
    error,
    fetchOrders,
    currentCourierId
  };
};