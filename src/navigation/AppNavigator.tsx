import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import BookingScreen from '../screens/BookingScreen'
import CheckoutScreen from '../screens/CheckoutScreen'
import ComboDetailScreen from '../screens/ComboDetailScreen'
import CourierOrderDetailScreen from '../screens/CourierOrderDetailScreen'
import CourierScreen from '../screens/CourierScreen'
import KitchenScreen from '../screens/KitchenScreen'
import SelectionScreen from '../screens/SelectionScreen'
import UserOrderDetailScreen from '../screens/UserOrderDetailScreen'
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
  </Stack.Navigator>
)

// Kitchen Stack Navigator (for kitchen staff)
const KitchenStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name='KitchenMain' component={KitchenScreen} />
  </Stack.Navigator>
)

// Courier Stack Navigator (for couriers)
const CourierStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name='CourierMain' component={CourierScreen} />
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

  // Show loading state while checking auth
  if (loading) {
    return null // Or return a loading screen component
  }

  // Conditional rendering based on user role
  // If user is kitchen staff, show KitchenStack
  if (user && role === 'kitchen') {
    return <KitchenStack />
  }

  // If user is courier, show CourierStack
  if (user && role === 'courier') {
    return <CourierStack />
  }

  // Default: show UserStack (for regular users or non-authenticated users)
  return <UserStack />
}

export default AppNavigator