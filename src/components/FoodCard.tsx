import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.44; // Ikki ustunli grid uchun ideal o'lcham

export const FoodCard = ({ item }: { item: any }) => {
  const { addToCart } = useCart();
  const imageSource = item.image_url || item.image || item.img;

  // ==================== ADD TO CART ====================
  const handleAddToCart = () => {
    addToCart({ ...item, image: imageSource });
  };

  // ==================== RENDER ====================
  return (
    <View style={styles.card}>
      {/* Rasm qismi */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: imageSource || 'https://via.placeholder.com/150' }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* HIT Badge */}
        {item.is_hit && (
          <View style={styles.hitBadge}>
            <MaterialCommunityIcons name="fire" size={12} color="white" />
            <Text style={styles.hitText}>HIT</Text>
          </View>
        )}


      </View>

      {/* Ma'lumotlar qismi */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        <Text style={styles.description} numberOfLines={1}>
          {item.description || 'Ajoyib tam...'}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.priceBox}>
            <Text style={styles.price}>{item.price?.toLocaleString()}</Text>
            <Text style={styles.currency}> so'm</Text>
          </View>

          <TouchableOpacity
            onPress={handleAddToCart}
            activeOpacity={0.6}
            style={styles.plusButton}
          >
            <MaterialCommunityIcons name="plus" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 10,
    width: CARD_WIDTH,
    marginBottom: 20,
    marginHorizontal: width * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  imageWrapper: {
    width: '100%',
    height: 130,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hitBadge: {
    position: 'absolute',
    top: 8,
    left: 8, // Chapda qoldik, yurakcha o'ngda bo'ladi
    backgroundColor: '#FF0000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  hitText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 2,
  },
  info: {
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  description: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  currency: {
    fontSize: 10,
    color: '#FF0000',
    fontWeight: '600',
  },
  plusButton: {
    backgroundColor: '#FF0000',
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});