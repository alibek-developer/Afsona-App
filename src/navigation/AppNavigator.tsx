import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import BookingScreen from '../screens/BookingScreen'
import CheckoutScreen from '../screens/CheckoutScreen'
import ComboDetailScreen from '../screens/ComboDetailScreen'
import CourierOrderDetailScreen from '../screens/CourierOrderDetailScreen'
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen'
import SelectionScreen from '../screens/SelectionScreen'
import UserOrderDetailScreen from '../screens/UserOrderDetailScreen'
import CourierTabNavigator from './CourierTabNavigator'
import TabNavigator from './TabNavigator'

const Stack = createNativeStackNavigator()

// User Stack Navigator (for regular users)
const UserStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name='Selection' component={SelectionScreen} />
    <Stack.Screen name='Main' component={TabNavigator} />
    <Stack.Screen name='Checkout' component={CheckoutScreen} />
    <Stack.Screen
      name='ComboDetail'
      component={ComboDetailScreen}
      options={{
        animation: 'fade_from_bottom',
      }}
    />
    <Stack.Screen 
      name='Booking' 
      component={BookingScreen} 
      options={{
        headerShown: true,
        headerTitle: 'Xona bron qilish',
        animation: 'slide_from_right'
      }}
    />
    <Stack.Screen 
      name='UserOrderDetail' 
      component={UserOrderDetailScreen}
      options={{
        animation: 'slide_from_right'
      }}
    />
    <Stack.Screen 
      name='PaymentSuccess' 
      component={PaymentSuccessScreen}
      options={{
        headerShown: false,
        animation: 'slide_from_bottom'
      }}
    />
  </Stack.Navigator>
)



// Courier Stack Navigator (for couriers) — wraps bottom tabs + order detail
const CourierStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name='CourierTabs' component={CourierTabNavigator} />
    <Stack.Screen 
      name='CourierOrderDetail' 
      component={CourierOrderDetailScreen}
      options={{
        animation: 'slide_from_right'
      }}
    />
  </Stack.Navigator>
)

const AppNavigator = () => {
  const { user, role, loading } = useAuth()

  if (loading) {
    return null
  }

  if (user && role === 'courier') {
    return <CourierStack />
  }

  return <UserStack />
}

export default AppNavigator