import { useNavigation } from '@react-navigation/native';
import { Calendar, ChevronRight, Search, ShoppingCart } from 'lucide-react-native'; // Calendar va ChevronRight qo'shildi
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ImageBackground,
    Platform,
    RefreshControl,
    StatusBar as RNStatusBar,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { CategoryItem } from '../components/CategoryItem';
import { FoodCard } from '../components/FoodCard';
import { COMBO_SETS } from '../constants/mockData';
import { useCart } from '../context/CartContext';
import {
    Category,
    fetchCategories,
    fetchMenuItemsByCategory,
    MenuItem,
} from '../services/api';

const { width } = Dimensions.get('window')
const MAIN_RED = '#FF0000'

const MenuScreen = () => {
  const navigation = useNavigation<any>()
  const { cartItems } = useCart()

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryName, setSelectedCategoryName] =
    useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [foodItems, setFoodItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      setCategoriesLoading(true)
      const categoriesData = await fetchCategories()
      setCategories(categoriesData)
      await fetchMenuItems(
        selectedCategoryName === 'all' ? undefined : selectedCategoryName,
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
  }, [selectedCategoryName])

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
        selectedCategoryName === 'all' ? undefined : selectedCategoryName,
      )
    }
  }, [selectedCategoryName])

  const filteredData = (
    selectedCategoryName?.toLowerCase() === 'combo' ? COMBO_SETS : foodItems || []
  ).filter(item => item?.name?.toLowerCase().includes(searchQuery?.toLowerCase() || ''))

  return (
    <View style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor='white' translucent />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Xush kelibsiz! 👋</Text>
            <Text style={styles.brandTitle}>Afsona Restoran Menu</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Savat')}
            style={styles.cartButton}
            activeOpacity={0.8}
          >
            <ShoppingCart size={22} color='white' />
            {(cartItems?.length || 0) > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchWrapper}>
          <Search size={18} color='#9CA3AF' />
          <TextInput
            placeholder='Taomlarni izlash...'
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor='#9CA3AF'
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={MAIN_RED}
          />
        }
      >
        
        {/* --- YANGI QO'SHILGAN: XONA BRON QILISH TUGMASI --- */}
        <TouchableOpacity 
          style={styles.bookingBanner}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Booking')} // BookingScreen ga o'tish
        >
          <View style={styles.bookingContent}>
            <View style={styles.iconCircle}>
              <Calendar size={24} color={MAIN_RED} />
            </View>
            <View style={styles.bookingTexts}>
              <Text style={styles.bookingTitle}>Joy band qilish</Text>
              <Text style={styles.bookingSubtitle}>Oilaviy yoki do'stlar bilan</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
        {/* -------------------------------------------------- */}

        {/* BUGUNGI TAKLIFLAR (COMBO) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bugungi Takliflar</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {(COMBO_SETS || []).map(combo => (
              <TouchableOpacity
                key={combo.id}
                onPress={() => navigation.navigate('ComboDetail', { combo })}
                activeOpacity={0.9}
                style={styles.comboCard}
              >
                <ImageBackground
                  source={{ uri: combo.image }}
                  style={styles.comboImage}
                  imageStyle={{ borderRadius: 25 }}
                >
                  <View style={styles.comboOverlay}>
                    <Text style={styles.comboName}>{combo.name}</Text>
                    <View style={styles.priceTag}>
                      <Text style={styles.comboPrice}>
                        {combo.price?.toLocaleString() || 0} UZS
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
          <Text style={styles.sectionTitle}>Menyu Bo'limlari</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            <CategoryItem
              name='Hammasi'
              isActive={selectedCategoryName === 'all'}
              onPress={() => setSelectedCategoryName('all')}
            />
            {(categories || []).map(cat => (
              <CategoryItem
                key={cat.id}
                name={cat.name}
                isActive={selectedCategoryName === cat.name}
                onPress={() => setSelectedCategoryName(cat.name)}
              />
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
            <Text style={styles.countText}>{(filteredData?.length || 0)} ta</Text>
          </View>

          {loading && !refreshing ? (
            <ActivityIndicator
              size='large'
              color={MAIN_RED}
              style={{ marginTop: 40 }}
            />
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
                  <Text style={styles.emptyResultsText}>Hech narsa topilmadi 😕</Text>
                  <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Qayta urinish</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    // Android va iOS uchun xavfsiz tepa qism
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 10 : 55,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  brandTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.8,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#111827',
    height: '100%',
  },
  cartButton: {
    width: 48,
    height: 48,
    backgroundColor: MAIN_RED,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    // Soft red shadow
    shadowColor: MAIN_RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#111827',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 100, // Tab bar uchun joy
  },
  // --- YANGI TUGMA STYLE ---
  bookingBanner: {
    marginHorizontal: 20,
    marginTop: 15,
    backgroundColor: '#FEF2F2', // Juda och qizil fon
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  bookingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 45,
    height: 45,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingTexts: {
    flex: 1,
    marginLeft: 15,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  bookingSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  // -------------------------
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  horizontalScroll: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  categoryScroll: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  comboCard: {
    marginRight: 15,
    width: width * 0.78,
    height: 170,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
  },
  comboImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  comboOverlay: {
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  comboName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  priceTag: {
    backgroundColor: MAIN_RED,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 6,
  },
  comboPrice: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
    marginBottom: 5,
  },
  countText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  foodCardWrapper: {
    width: '50%',
    padding: 2,
  },
  emptyResults: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyResultsText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: MAIN_RED,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
  },
})

export default MenuScreen