import { MaterialCommunityIcons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Dimensions, StyleSheet, View } from 'react-native'
import { useCart } from '../context/CartContext'

import CartScreen from '../screens/CartScreen'
import MenuScreen from '../screens/MenuScreen'
import OrdersScreen from '../screens/OrdersScreen'
import ProfileScreen from '../screens/ProfileScreen'

const Tab = createBottomTabNavigator()
const { width } = Dimensions.get('window');

const TabNavigator = () => {
  const { cartItems } = useCart()
  const itemCount = cartItems.length
  const MAIN_RED = '#FF0000'

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: MAIN_RED,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          // RASMDAGIDEK FLOATING EFFEKTI
          backgroundColor: '#FFFFFF',
          borderRadius: 30, // Chetlarini to'liq yumaloq qilish
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          marginHorizontal: 15,
          marginBottom: 15,
          
          // SOYA (Shadow)
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,
          
          borderTopWidth: 0, // Tepasidagi chiziqni olib tashlash
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 5,
        },
      }}
    >
      <Tab.Screen
        name='Menyu'
        component={MenuScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.pill, focused && styles.activePill]}>
              <MaterialCommunityIcons
                name={focused ? 'food' : 'food-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      
      <Tab.Screen
        name='Savat'
        component={CartScreen}
        options={{
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: MAIN_RED,
            color: '#FFFFFF',
          },
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.pill, focused && styles.activePill]}>
              <MaterialCommunityIcons
                name={focused ? 'cart' : 'cart-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      
      <Tab.Screen
        name='Buyurtmalar'
        component={OrdersScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.pill, focused && styles.activePill]}>
              <MaterialCommunityIcons
                name={focused ? 'clipboard-text' : 'clipboard-text-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      
      <Tab.Screen
        name='Profil'
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.pill, focused && styles.activePill]}>
              <MaterialCommunityIcons
                name={focused ? 'account' : 'account-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  pill: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  activePill: {
    backgroundColor: '#FFF1F1',
  },
})

export default TabNavigator