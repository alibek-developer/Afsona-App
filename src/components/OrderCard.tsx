import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Order } from '../hooks/useRealtimeOrders';

interface OrderCardProps {
  order: Order;
  currentCourierId: string;
}

const OrderCard = ({ order, currentCourierId }: OrderCardProps) => {
  const navigation = useNavigation<any>();


  // Format address
  const shortAddress = order.delivery_address
    ? order.delivery_address.split(',').slice(0, 2).join(', ')
    : "Manzil yo'q";

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate status and button visibility
  const getStatusInfo = () => {
    if (order.status === 'ready') {
      return {
        text: 'Tayyor',
        color: '#10B981',
      };
    } else if (order.status === 'on_the_way') {
      return {
        text: 'Yo\'lda',
        color: '#3B82F6',
      };
    } else if (order.status === 'yangi') {
      return {
        text: 'Yangi',
        color: '#FF0000',
      };
    } else if (order.status === 'tayyorlanmoqda') {
      return {
        text: 'Tayyorlanmoqda',
        color: '#F59E0B',
      };
    } else if (order.status === 'yetkazildi') {
      return {
        text: 'Yetkazildi',
        color: '#6B7280',
      };
    }
    return {
      text: order.status,
      color: '#6B7280',
    };
  };

  const statusInfo = getStatusInfo();



  const handleCardPress = () => {
    navigation.navigate('CourierOrderDetail', {
      order,
      currentCourierId: currentCourierId
    });
  };

  return (
    // ✅ Use plain View for card container — avoids nested TouchableOpacity swallowing inner taps
    <View style={styles.orderCard}>

      {/* Tappable area for card navigation — only covers top part */}
      <TouchableOpacity activeOpacity={0.7} onPress={handleCardPress}>
        {/* Top Section - Status Badge and Time */}
        <View style={styles.topSection}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
          <Text style={styles.timeText}>
            {formatDate(order.created_at)}
          </Text>
        </View>

        {/* Customer Info */}
        <View style={styles.customerSection}>
          <View style={styles.customerAvatar}>
            <MaterialCommunityIcons name="account" size={22} color="#FF0000" />
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName} numberOfLines={1}>
              {order.customer_name}
            </Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {shortAddress}
            </Text>
          </View>
        </View>

        {/* Bottom Section - Price and Distance */}
        <View style={styles.bottomSection}>
          <Text style={styles.priceText}>
            {order.total_amount.toLocaleString()} so'm
          </Text>
          <Text style={styles.distanceText}>2.5 km</Text>
        </View>
      </TouchableOpacity>


    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF1F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF0000',
  },
  distanceText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default OrderCard;