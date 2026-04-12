import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

const { width, height } = Dimensions.get('window')
const MAIN_RED = '#FF0000'

const ComboDetailScreen = () => {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const { bannerId } = route.params
  const { addToCart } = useCart()

  const [banner, setBanner] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('website_banners')
          .select('*')
          .eq('id', bannerId)
          .single()

        if (error) {
          console.error('Error fetching banner:', error)
        } else {
          setBanner(data)
        }
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (bannerId) {
      fetchBanner()
    }
  }, [bannerId])

  const handleAddToCart = () => {
    if (!banner) return

    // Narxni stringdan songa o'tkazish (hisob-kitoblar uchun)
    const numericPrice = banner.cta_button_text 
      ? parseInt(banner.cta_button_text.replace(/[^0-9]/g, '')) 
      : 0

    addToCart({ 
      id: banner.id,
      name: banner.title,
      image: banner.image_url,
      price: numericPrice,
      quantity: 1 
    })
    navigation.goBack()
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={MAIN_RED} />
      </View>
    )
  }

  if (!banner) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.description}>Ma'lumot topilmadi</Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { top: insets.top + 10 }]}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="black" />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* 1. Rasm - Header */}
      <View style={styles.imageHeader}>
        <Image
          source={{ uri: banner.image_url }}
          style={styles.mainImage}
          resizeMode='cover'
        />
        {/* Gradient Overlay (Rasm ustidagi yozuvlar uchun) */}
        <View style={styles.overlay} />
        
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { top: insets.top + 10 }]}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="black" />
        </TouchableOpacity>
      </View>

      {/* 2. Ma'lumotlar - Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.contentScroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <Animated.View 
          entering={FadeInDown.duration(600)}
          style={styles.infoBox}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>{banner.title}</Text>
            <View style={styles.hitBadge}>
              <MaterialCommunityIcons name="fire" size={14} color="white" />
              <Text style={styles.hitText}>POPULAR</Text>
            </View>
          </View>

          <Text style={styles.description}>{banner.description}</Text>

          {/* Xususiyatlar */}
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={MAIN_RED} />
              <Text style={styles.featureText}>30-45 daqiqa</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="silverware-clean" size={20} color={MAIN_RED} />
              <Text style={styles.featureText}>Issiq yetkazish</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Tarkibi va ma'lumot</Text>
          <Text style={styles.longDescription}>
            {banner.link_type}
          </Text>
        </Animated.View>
      </ScrollView>

      {/* 3. Footer - Narx va Tugma */}
      <Animated.View 
        entering={FadeIn.delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}
      >
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Jami narx:</Text>
          <Text style={styles.priceValue}>{banner.cta_button_text}</Text>
        </View>

        <TouchableOpacity
          onPress={handleAddToCart}
          activeOpacity={0.9}
          style={styles.orderButton}
        >
          <Text style={styles.orderButtonText}>Savatga qo'shish</Text>
          <View style={styles.buttonIcon}>
            <MaterialCommunityIcons name="arrow-right" size={20} color={MAIN_RED} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  imageHeader: { width: width, height: height * 0.45 },
  mainImage: { width: '100%', height: '100%' },
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.1)' 
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    backgroundColor: 'white',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  contentScroll: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    backgroundColor: '#F9FAFB',
  },
  infoBox: {
    padding: 25,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#111827', 
    flex: 1, 
    marginRight: 10 
  },
  hitBadge: {
    backgroundColor: MAIN_RED,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  hitText: { color: 'white', fontSize: 10, fontWeight: '900', marginLeft: 4 },
  description: { 
    fontSize: 16, 
    color: '#6B7280', 
    marginTop: 8, 
    lineHeight: 24 
  },
  featuresRow: { 
    flexDirection: 'row', 
    marginTop: 20, 
    gap: 20 
  },
  featureItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  featureText: { 
    fontSize: 13, 
    color: '#374151', 
    fontWeight: '600' 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#E5E7EB', 
    marginVertical: 25 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#111827', 
    marginBottom: 10 
  },
  longDescription: { 
    fontSize: 14, 
    color: '#9CA3AF', 
    lineHeight: 22 
  },
  footer: {
    paddingHorizontal: 25,
    paddingTop: 20,
    backgroundColor: 'white',
    width: width,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceContainer: { flex: 1 },
  priceLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  priceValue: { fontSize: 20, fontWeight: '900', color: '#111827' },
  orderButton: {
    backgroundColor: MAIN_RED,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: MAIN_RED,
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  orderButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },
  buttonIcon: {
    backgroundColor: 'white',
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default ComboDetailScreen;