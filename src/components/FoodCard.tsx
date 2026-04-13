import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useCart } from '../context/CartContext'

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.46; // Kengaytirildi: 0.43 -> 0.46

export const FoodCard = ({ item }: { item: any }) => {
  const { addToCart, cartItems } = useCart();
  const imageSource = item.image_url || item.image || item.img;
  const cartItem = cartItems?.find((i: any) => i.id === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => addToCart({ ...item, image: imageSource });

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.95}>
      {/* === IMAGE === */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageSource || 'https://via.placeholder.com/200' }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.imageGradient} />
        
        {/* Badges */}
        <View style={styles.badges}>
          {item.is_hit && (
            <View style={[styles.badge, styles.hit]}>
              <MaterialCommunityIcons name="fire" size={11} color="white" />
              <Text style={styles.badgeText}>HIT</Text>
            </View>
          )}
          {item.discount && (
            <View style={[styles.badge, styles.discount]}>
              <Text style={styles.badgeText}>-{item.discount}%</Text>
            </View>
          )}
        </View>
      </View>

      {/* === CONTENT === */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={1}>
          {item.description || 'Mazali va to\'yimli taom'}
        </Text>

        {/* === PRICE SECTION === */}
        <View style={styles.priceSection}>
          <View style={styles.priceGroup}>
            {item.old_price && (
              <Text style={styles.oldPrice}>{item.old_price?.toLocaleString()} so'm</Text>
            )}
            <View style={styles.priceTag}>
              <Text style={styles.price}>{item.price?.toLocaleString()}</Text>
              <Text style={styles.currency}> so'm</Text>
            </View>
          </View>

          {/* === ACTION (IXCHAM TUGMA) === */}
          <TouchableOpacity 
            style={[styles.addBtn, quantity > 0 && styles.addBtnActive]} 
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons 
              name={quantity > 0 ? "cart-check" : "plus"} 
              size={18} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },

  // === IMAGE ===
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imageGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  // === BADGES ===
  badges: {
    position: 'absolute',
    top: 8, left: 8, right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  badge: {
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  hit: { backgroundColor: '#EF4444' },
  discount: { backgroundColor: '#10B981', position: 'absolute', right: 0 },
  badgeText: { color: 'white', fontSize: 8, fontWeight: '800' },

  // === CONTENT ===
  content: { padding: 10, paddingTop: 10 },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  desc: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },

  // === PRICE SECTION ===
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceGroup: { 
    flex: 1,
    paddingRight: 5,
  },
  oldPrice: {
    fontSize: 10,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827', 
  },
  currency: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },

  // === BUTTONS (IXCHAM) ===
  addBtn: {
    width: 34,
    height: 34,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnActive: {
    backgroundColor: '#10B981', // Qo'shilganda yashil rangga o'tadi
    shadowColor: '#10B981',
  },
});