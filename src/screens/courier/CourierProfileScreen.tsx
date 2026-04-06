import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import {
  Alert,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'

const CourierProfileScreen = () => {
  const { user, logout, authLoading } = useAuth()

  const handleLogout = () => {
    Alert.alert(
      'Chiqish',
      'Tizimdan chiqishni xohlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Chiqish',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout()
            } catch (err) {
              console.log('Logout error:', err)
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <View style={styles.content}>
        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account" size={48} color="#E53935" />
          </View>
          <Text style={styles.email}>{user?.email || 'Kuryer'}</Text>
          <View style={styles.roleBadge}>
            <MaterialCommunityIcons name="motorbike" size={14} color="#FFF" />
            <Text style={styles.roleText}>Kuryer</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionItem} onPress={handleLogout} disabled={authLoading}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFF5F5' }]}>
              <MaterialCommunityIcons name="logout" size={22} color="#E53935" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Tizimdan chiqish</Text>
              <Text style={styles.actionSub}>Hisobdan chiqish</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Afsona Kuryer</Text>
          <Text style={styles.infoVersion}>Versiya 1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : (RNStatusBar.currentHeight || 0) + 8,
    paddingBottom: 16,
    backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },

  content: { flex: 1, padding: 20 },

  avatarCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  email: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E53935', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  roleText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  actions: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  actionSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  infoVersion: { fontSize: 13, color: '#94A3B8' },
})

export default CourierProfileScreen
