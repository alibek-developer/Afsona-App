import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useCart } from '../context/CartContext'

const { width } = Dimensions.get('window');

const PRIMARY_RED = '#E63946';

export const FoodCard = ({ item }: { item: any }) => {
  const { addToCart, cartItems } = useCart();
  const imageSource = item.image_url || item.image || item.img;
  const cartItem = cartItems?.find((i: any) => i.id === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => addToCart({ ...item, image: imageSource });

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.imageContainer} activeOpacity={0.9} onPress={handleAddToCart}>
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
              <MaterialCommunityIcons name="fire" size={12} color="white" />
              <Text style={styles.badgeText}>HIT</Text>
            </View>
          )}
          {item.discount && (
            <View style={[styles.badge, styles.discount]}>
              <Text style={styles.badgeText}>-{item.discount}%</Text>
            </View>
          )}
        </View>

        {/* Action Button over Image */}
        <TouchableOpacity 
          style={[styles.addBtn, quantity > 0 && styles.addBtnActive]} 
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
             name={quantity > 0 ? "cart-check" : "plus"} 
             size={20} 
             color={quantity > 0 ? "white" : "#111827"} 
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={1}>
          {item.description || "Ta'rifi yo'q"}
        </Text>

        <View style={styles.priceSection}>
          {item.old_price && (
            <Text style={styles.oldPrice}>{item.old_price?.toLocaleString()} so'm</Text>
          )}
          <View style={styles.priceTag}>
            <Text style={styles.price}>{item.price?.toLocaleString()}</Text>
            <Text style={styles.currency}> sum</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%', 
    marginBottom: 8,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },
  image: { width: '100%', height: '100%' },
  imageGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  badges: {
    position: 'absolute',
    top: 12, left: 12,
    flexDirection: 'column',
    gap: 6,
    zIndex: 2,
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  hit: { backgroundColor: PRIMARY_RED },
  discount: { backgroundColor: '#10B981' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '800' },
  
  addBtn: {
    position: 'absolute',
    bottom: 12, right: 12,
    width: 38,
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  addBtnActive: {
    backgroundColor: '#10B981',
  },

  content: { paddingHorizontal: 4, paddingTop: 12 },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  desc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  priceSection: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  oldPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    color: PRIMARY_RED, 
  },
  currency: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
});