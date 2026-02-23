import { useEffect, useRef } from 'react';
import Toast from 'react-native-toast-message';
import { Order, OrderStatus } from './useRealtimeOrders';

// Status change messages
const statusMessages: Record<OrderStatus | 'bekor_qilindi', { title: string; body: string; type: 'success' | 'error' | 'info' }> = {
  yangi: { title: 'Buyurtma yaratildi', body: 'Yangi buyurtma tushdi', type: 'success' },
  qabul_qilindi: { title: 'Oshxona qabul qildi', body: 'Oshxona buyurtmangizni qabul qildi', type: 'info' },
  tayyorlanmoqda: { title: 'Tayyorlanmoqda', body: 'Taom tayyorlanmoqda', type: 'info' },
  tayyor: { title: 'Buyurtma tayyor', body: 'Buyurtmangiz yetkazish uchun tayyor', type: 'info' },
  new: { title: 'Buyurtma yaratildi', body: 'Yangi buyurtma tushdi', type: 'success' },
  ready: { title: 'Buyurtma tayyor', body: 'Buyurtmangiz yetkazish uchun tayyor', type: 'info' },
  accepted: { title: 'Kuryer topildi', body: 'Kuryer buyurtmangizni qabul qildi', type: 'success' },
  on_the_way: { title: 'Kuryer yo\'lda', body: 'Kuryer buyurtmangizni olib ketdi', type: 'info' },
  olingan: { title: 'Buyurtma qabul qilindi', body: 'Siz buyurtmani qabul qildingiz', type: 'success' },
  olib_ketildi: { title: 'Kuryer yo\'lda', body: 'Kuryer buyurtmangizni olib ketdi', type: 'info' },
  yetkazildi: { title: 'Yetkazildi', body: 'Buyurtmangiz yetkazildi. Yoqimli ishtaha!', type: 'success' },
  bekor_qilindi: { title: 'Bekor qilindi', body: 'Buyurtmangiz bekor qilindi', type: 'error' },
}

export const useOrderNotifications = () => {
  const previousOrdersRef = useRef<Record<string, OrderStatus>>({})

  // Show toast notification
  const showToast = (title: string, body: string, type: 'success' | 'error' | 'info' = 'info') => {
    Toast.show({
      type,
      text1: title,
      text2: body,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
    });
  }

  // Schedule notification (now uses toast)
  const scheduleNotification = async (title: string, body: string, type: 'success' | 'error' | 'info' = 'info') => {
    showToast(title, body, type);
  }

  // Check for status changes and notify
  const checkAndNotify = (orders: Order[]) => {
    orders.forEach((order) => {
      const previousStatus = previousOrdersRef.current[order.id]
      
      // If this is a new order or status changed
      if (previousStatus && previousStatus !== order.status) {
        const message = statusMessages[order.status]
        if (message) {
          scheduleNotification(message.title, message.body, message.type)
          console.log(`📱 Toast sent: ${message.title} - ${message.body}`)
        }
      }
      
      // Update ref
      previousOrdersRef.current[order.id] = order.status
    })

    // Clean up old orders from ref
    const currentOrderIds = new Set(orders.map(o => o.id))
    Object.keys(previousOrdersRef.current).forEach(id => {
      if (!currentOrderIds.has(id)) {
        delete previousOrdersRef.current[id]
      }
    })
  }

  return {
    showToast,
    scheduleNotification,
    checkAndNotify,
  }
}

// Hook to use with orders
export const useOrderStatusNotifications = (orders: Order[]) => {
  const { checkAndNotify } = useOrderNotifications()

  useEffect(() => {
    if (orders.length > 0) {
      checkAndNotify(orders)
    }
  }, [orders])
}