import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useState } from 'react'
import {
	ActivityIndicator,
	Alert,
	Linking,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import { MAX_DELIVERY_RADIUS_KM, RESTAURANT_LOCATION } from '../lib/constants'

// Masofani hisoblash (Haversine formulasi) - GRADUSNI KM GA O'GIRADI
const calculatePreciseDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371 // Yer radiusi km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

interface Props {
  onLocationSelect: (address: string, distance: number, tooFar: boolean, coords: {lat: number, lng: number}) => void
}

export const LocationPicker = ({ onLocationSelect }: Props) => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleGetLocation = async () => {
    setLoading(true)
    try {
      // 1. Ruxsat olish
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Xato', 'GPS ruxsatini sozlamalardan yoqing.')
        setLoading(false)
        return
      }

      // 2. Koordinatani olish
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const { latitude, longitude } = location.coords

      // 3. Masofani hisoblash
      const dist = calculatePreciseDistance(
        latitude,
        longitude,
        RESTAURANT_LOCATION.lat,
        RESTAURANT_LOCATION.lng,
      )

      const tooFar = dist > MAX_DELIVERY_RADIUS_KM
      const distanceText = dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`

      // 4. Manzilni olish
      let addressRes = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      })

      let addressStr = 'Aniqlanmagan joy'
      if (addressRes.length > 0) {
        const item = addressRes[0]
        const city = item.city || item.region || ''
        const street = item.street || ''
        const name = item.name && item.name !== item.street ? item.name : ''
        addressStr = `${city}${street ? ', ' + street : ''}${name ? ' ' + name : ''}`.trim()
      }

      setResult({ text: distanceText, tooFar, lat: latitude, lng: longitude })
      
      // CheckoutScreen ga ma'lumotni uzatish
      onLocationSelect(addressStr, dist, tooFar, { lat: latitude, lng: longitude })

    } catch (error) {
      Alert.alert('Xatolik', "GPS'ni yoqing va qayta urining.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleGetLocation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color='#FF6B00' />
        ) : (
          <>
            <MaterialCommunityIcons name='map-marker-radius' size={24} color='#FF6B00' />
            <Text style={styles.buttonText}>
              {result ? 'MANZILNI YANGILASH' : 'MANZILNI ANIQLASH'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {result && (
        <TouchableOpacity
          style={[styles.card, result.tooFar ? styles.tooFarCard : styles.okCard]}
          onPress={() =>
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${result.lat},${result.lng}`)
          }
        >
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name={result.tooFar ? 'alert-circle' : 'check-circle'}
              size={32}
              color={result.tooFar ? '#DC2626' : '#10B981'}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.distanceLabel}>
                Masofa: <Text style={{color: result.tooFar ? '#DC2626' : '#10B981'}}>{result.text}</Text>
              </Text>
              <Text style={[styles.statusText, { color: result.tooFar ? '#DC2626' : '#059669' }]}>
                {result.tooFar
                  ? "⚠️ Hududdan tashqaridasiz"
                  : '✓ Yetkazib berish mumkin'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 12 },
  button: {
    height: 56,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: { fontWeight: '900', fontSize: 13, color: '#1A1A1A' },
  card: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFF',
  },
  okCard: { borderLeftWidth: 6, borderLeftColor: '#10B981' },
  tooFarCard: { borderLeftWidth: 6, borderLeftColor: '#DC2626' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  distanceLabel: { fontSize: 16, fontWeight: '900', color: '#1A1A1A' },
  statusText: { fontSize: 12, fontWeight: '700', marginTop: 2 },
})