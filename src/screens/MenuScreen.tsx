import { useNavigation } from '@react-navigation/native'
import { ChevronRight, Search, ShoppingCart } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  LayoutAnimation,
  Platform,
  RefreshControl,
  StatusBar as RNStatusBar,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native'

import { CategoryItem } from '../components/CategoryItem'
import { FoodCard } from '../components/FoodCard'
import { COMBO_SETS } from '../constants/mockData'
import { useCart } from '../context/CartContext'
import {
  Category,
  fetchBanners,
  fetchCategories,
  fetchMenuItemsByCategory,
  MenuItem,
} from '../services/api'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window')
const MAIN_RED = '#E63946'

function MenuScreen() {
  const navigation = useNavigation<any>()
  const { cartItems } = useCart()

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [foodItems, setFoodItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [banners, setBanners] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      setCategoriesLoading(true)
      const [categoriesData, bannersData] = await Promise.all([
        fetchCategories(),
        fetchBanners()
      ])
      setCategories(categoriesData)
      setBanners(bannersData)
      await fetchMenuItems(
        selectedCategoryId === 'all' ? undefined : selectedCategoryId
      )
    } catch (error) {
      console.error('Data loading error:', error)
    } finally {
      setCategoriesLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadData()
  }, [selectedCategoryId])

  const fetchMenuItems = async (categoryId?: string) => {
    try {
      setLoading(true)
      const menuItems = await fetchMenuItemsByCategory(categoryId)
      setFoodItems(menuItems)
    } catch (error) {
      console.error('Error fetching menu items:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!categoriesLoading) {
      fetchMenuItems(
        selectedCategoryId === 'all' ? undefined : selectedCategoryId
      )
    }
  }, [selectedCategoryId])

  const filteredData = (
    selectedCategoryName?.toLowerCase() === 'combo' ? COMBO_SETS : foodItems || []
  ).filter(item => item?.name?.toLowerCase().includes(searchQuery?.toLowerCase() || ''))

  return (
    <View style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor='#F9FAFB' translucent />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Xush kelibsiz! 👋</Text>
            <Text style={styles.brandTitle}>Afsona Menu</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Savat')}
            style={styles.cartButton}
            activeOpacity={0.8}
          >
            <ShoppingCart size={22} color='#111827' />
            {(cartItems?.length || 0) > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchWrapper}>
          <Search size={20} color='#9CA3AF' />
          <TextInput
            placeholder='Sevimli taomingizni izlang...'
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor='#A1A1AA'
            style={styles.searchInput} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={MAIN_RED} />}
      >

        {/* --- XONA BRON QILISH TUGMASI (YANGILANGAN) --- */}
        <TouchableOpacity
          style={styles.bookingBanner}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Booking')}
        >
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop' }} // Restoran foni
            style={styles.bookingBg}
            imageStyle={{ borderRadius: 24 }}
          >
            <View style={styles.bookingOverlay}>
              <View style={styles.bookingContent}>
                <View style={styles.bookingTexts}>
                  <Text style={styles.bookingTitle}>Joy band qilish</Text>
                  <Text style={styles.bookingSubtitle}>Oilaviy yoki do'stlar davrasida unutilmas oqshom</Text>
                </View>
                <View style={styles.iconCircle}>
                  <ChevronRight size={24} color={MAIN_RED} />
                </View>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>
        {/* -------------------------------------------------- */}

        {/* BUGUNGI TAKLIFLAR (COMBO) (YANGILANGAN) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderLine}>
            <Text style={styles.sectionTitle}>Maxsus takliflar</Text>
            <MaterialCommunityIcons name="fire" size={24} color={MAIN_RED} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {(banners || []).map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => navigation.navigate('ComboDetail', { bannerId: item.id })}
                activeOpacity={0.9}
                style={styles.comboCard}
              >
                <ImageBackground
                  source={{ uri: item.image_url }}
                  style={styles.comboImage}
                  imageStyle={{ borderRadius: 28 }}
                >
                  <View style={styles.comboGradient}>
                    <View>
                      <Text style={styles.comboName}>{item.title}</Text>
                    </View>
                    <View style={styles.priceTag}>
                      <Text style={styles.comboPrice}>
                        {item.cta_button_text}
                      </Text>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* BO'LIMLAR (CATEGORIES) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle2}>Menyu</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            <CategoryItem
              name='Hammasi'
              isActive={selectedCategoryId === 'all'}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
                setSelectedCategoryId('all')
                setSelectedCategoryName('all')
              } } />
            {(categories || []).map(cat => (
              <CategoryItem
                key={cat.id}
                name={cat.name}
                isActive={selectedCategoryId === cat.id}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
                  setSelectedCategoryId(cat.id)
                  setSelectedCategoryName(cat.name)
                } } />
            ))}
          </ScrollView>
        </View>

        {/* TAOMLAR RO'YXATI (FOOD GRID) */}
        <View style={[styles.section, { marginBottom: 20 }]}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategoryName === 'all'
                ? 'Barcha taomlar'
                : selectedCategoryName}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{(filteredData?.length || 0)}</Text>
            </View>
          </View>

          {loading && !refreshing ? (
            <ActivityIndicator
              size='large'
              color={MAIN_RED}
              style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.foodGrid}>
              {filteredData.length > 0 ? (
                filteredData.map((item: any) => (
                  <View key={item.id} style={styles.foodCardWrapper}>
                    <FoodCard item={item} />
                  </View>
                ))
              ) : (
                <View style={styles.emptyResults}>
                  <Text style={styles.emptyResultsText}>Biz bu bo'limda hech narsa topmadik 😕</Text>
                  <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Yangilash</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

import { MaterialCommunityIcons } from '@expo/vector-icons'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Yengil kulrang fon (premium ko'rinish uchun)
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 10 : 50,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  cartButton: {
    width: 50,
    height: 50,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: MAIN_RED,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 15,
    height: 44,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#111827',
    height: '100%',
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 110, 
    paddingTop: 5,
  },
  
  // --- YANGILANGAN BRON QILISH BANNERI ---
  bookingBanner: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bookingBg: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
  },
  bookingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    padding: 20,
    justifyContent: 'center',
  },
  bookingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingTexts: {
    flex: 1,
    paddingRight: 10,
  },
  bookingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bookingSubtitle: {
    fontSize: 12,
    color: '#E5E7EB',
    fontWeight: '400',
    lineHeight: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ----------------------------------------

  section: {
    marginTop: 16,
  },
  sectionHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',

  },
  sectionTitle2: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 23,
  },
  horizontalScroll: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  categoryScroll: {
    paddingLeft: 24,
    paddingRight: 10,
  },
  comboCard: {
    marginRight: 14,
    width: width * 0.72,
    height: 160,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  comboImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  comboGradient: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  comboName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  priceTag: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  comboPrice: {
    color: MAIN_RED,
    fontSize: 13,
    fontWeight: '800',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  countBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '700',
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  foodCardWrapper: {
    width: '48.5%',
    marginBottom: 12,
  },
  emptyResults: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyResultsText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: MAIN_RED,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: MAIN_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
  },
})

export default MenuScreen