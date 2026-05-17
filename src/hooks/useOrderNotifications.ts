import { useEffect, useRef } from 'react';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { Order, OrderStatus } from './useRealtimeOrders';

// Status change messages
const statusMessages: Record<OrderStatus, { title: string; body: string; type: 'success' | 'error' | 'info' }> = {
  new: { title: 'Buyurtma yaratildi', body: 'Yangi buyurtma qabul qilindi', type: 'success' },
  accepted: { title: 'Qabul qilindi', body: 'Oshxona buyurtmangizni qabul qildi', type: 'info' },
  preparing: { title: 'Tayyorlanmoqda', body: 'Taom tayyorlanmoqda', type: 'info' },
  ready: { title: 'Buyurtma tayyor', body: 'Buyurtmangiz yetkazish uchun tayyor', type: 'info' },
  on_the_way: { title: "Kuryer yo'lda", body: "Kuryer buyurtmangizni olib ketdi", type: 'info' },
  delivered: { title: 'Yetkazildi', body: 'Buyurtmangiz yetkazildi. Yoqimli ishtaha!', type: 'success' },
  cancelled: { title: 'Bekor qilindi', body: 'Buyurtmangiz bekor qilindi', type: 'error' },
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

  // Schedule notification (now uses toast and local push)
  const scheduleNotification = async (title: string, body: string, type: 'success' | 'error' | 'info' = 'info') => {
    // 1. Vaqtinchalik In-App oynasini o'chiramiz, asl Push qanday ishlashini ko'rish uchun:
    // showToast(title, body, type);
    
    try {
      console.log("🔔 OS bildirishnomasi jo'natilmoqda...", title, body);
      // 2. Tizim (OS) bildirishnomasi (Tepadan tushadigan)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          sound: true,
        },
        trigger: null, // trigger null bo'lsa, xuddi shu zahoti chiqadi
      });
      console.log("✅ OS bildirishnomasi muvaffaqiyatli jo'natildi!");
    } catch (e) {
      console.error("❌ OS bildirishnomasida xatolik:", e);
    }
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