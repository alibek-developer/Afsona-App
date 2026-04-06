import { MaterialCommunityIcons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Dimensions, StyleSheet, View, Text } from 'react-native'
import { useOrders } from '../hooks/useOrders'

import CourierOrdersScreen from '../screens/courier/CourierOrdersScreen'
import CourierActiveRouteScreen from '../screens/courier/CourierActiveRouteScreen'
import CourierEarningsScreen from '../screens/courier/CourierEarningsScreen'
import CourierProfileScreen from '../screens/courier/CourierProfileScreen'

const Tab = createBottomTabNavigator()
const { width } = Dimensions.get('window')
const MAIN_RED = '#E53935'

const CourierTabNavigator = () => {
  const { myActiveOrders } = useOrders()
  const activeCount = myActiveOrders.length

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: MAIN_RED,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          marginHorizontal: 15,
          marginBottom: 15,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 5,
        },
      }}
    >
      <Tab.Screen
        name="Buyurtmalar"
        component={CourierOrdersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="inbox-arrow-down" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Faol"
        component={CourierActiveRouteScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconWithBadge}>
              <MaterialCommunityIcons name="truck-delivery" size={size} color={color} />
              {activeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{activeCount > 9 ? '9+' : activeCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Daromad"
        component={CourierEarningsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profil"
        component={CourierProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  iconWithBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: MAIN_RED,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
})

export default CourierTabNavigator
