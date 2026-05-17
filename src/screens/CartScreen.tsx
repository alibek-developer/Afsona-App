import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import {
	Image,
	StatusBar as RNStatusBar,
	ScrollView, // RNStatusBar deb nomlab import qilamiz
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native'
import Animated, { FadeInRight, Layout } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCart } from '../context/CartContext'
import { useOrder } from '../context/OrderContext'

const MAIN_RED = '#E63946' // Vibrantly appetizing red

const CartScreen = () => {
	const { cartItems, addToCart, removeFromCart, clearCart, getTotalPrice } =
		useCart()
	const { orderType } = useOrder()
	const navigation = useNavigation<any>()
	const insets = useSafeAreaInsets()

	const deliveryFee = orderType === 'delivery' ? 15000 : 0
	const totalPrice = getTotalPrice()
	const totalWithDelivery =
		totalPrice + (cartItems.length > 0 ? deliveryFee : 0)

	return (
		<View style={styles.safeArea}>
			{/* StatusBar barStyle ni to'g'irlaymiz */}
			<RNStatusBar barStyle='dark-content' backgroundColor='white' />

			<View style={styles.container}>
				{/* HEADER */}
				<View style={[styles.header, { paddingTop: insets.top + 10, height: 60 + insets.top }]}>
					<View>
						<Text style={styles.headerTitle}>Savat</Text>
						<View style={styles.orderTypeRow}>
							<MaterialCommunityIcons
								name={
									orderType === 'delivery' ? 'truck-delivery' : 'storefront'
								}
								size={16}
								color={MAIN_RED}
							/>
							<Text style={styles.orderTypeText}>
								{orderType === 'delivery' ? ' Yetkazib berish' : ' Restoranda'}
							</Text>
						</View>
					</View>

					{cartItems.length > 0 && (
						<TouchableOpacity onPress={clearCart} style={styles.clearButton}>
							<MaterialCommunityIcons
								name='trash-can-outline'
								size={20}
								color={MAIN_RED}
							/>
						</TouchableOpacity>
					)}
				</View>

				<ScrollView
					style={styles.scroll}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
				>
					{cartItems.length === 0 ? (
						<View style={styles.emptyContainer}>
							<View style={styles.emptyIconContainer}>
								<MaterialCommunityIcons
									name='cart-variant'
									size={80}
									color='#E5E7EB'
								/>
							</View>
							<Text style={styles.emptyTitle}>Savat bo'sh</Text>
							<Text style={styles.emptySubtitle}>
								Hali hech narsa qo'shmabsiz.{'\n'}Mazali taom tanlash vaqti
								keldi!
							</Text>
							<TouchableOpacity
								onPress={() => navigation.navigate('Menyu')}
								style={styles.backToMenuButton}
							>
								<Text style={styles.backToMenuText}>Menyuga o'tish</Text>
							</TouchableOpacity>
						</View>
					) : (
						<View style={styles.cartItemsSection}>
							<Text style={styles.sectionLabel}>Siz tanlagan taomlar</Text>

							{cartItems.map((item, index) => {
								const imgUri = item.image
								return (
									<Animated.View
										key={item.id}
										entering={FadeInRight.delay(index * 100)}
										layout={Layout.springify()}
										style={styles.cartItem}
									>
										<Image
											source={{
												uri: imgUri || 'https://via.placeholder.com/150',
											}}
											style={styles.itemImage}
										/>

										<View style={styles.itemInfo}>
											<Text style={styles.itemName} numberOfLines={1}>
												{item?.name || 'Mahsulot'}
											</Text>
											<Text style={styles.itemPrice}>
												{(item?.price || 0).toLocaleString()} so'm
											</Text>
										</View>

										<View style={styles.quantityControl}>
											<TouchableOpacity
												onPress={() => removeFromCart(item.id)}
												style={styles.actionButton}
											>
												<MaterialCommunityIcons
													name={
														item.quantity === 1 ? 'trash-can-outline' : 'minus'
													}
													size={18}
													color={item.quantity === 1 ? MAIN_RED : '#1F2937'}
												/>
											</TouchableOpacity>

											<Text style={styles.quantityText}>{item.quantity}</Text>

											<TouchableOpacity
												onPress={() => addToCart(item)}
												style={[
													styles.actionButton,
													{ backgroundColor: MAIN_RED },
												]}
											>
												<MaterialCommunityIcons
													name='plus'
													size={18}
													color='white'
												/>
											</TouchableOpacity>
										</View>
									</Animated.View>
								)
							})}
						</View>
					)}
				</ScrollView>

				{cartItems.length > 0 && (
					<View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
						<View style={styles.summaryCard}>
							<View style={styles.summaryRow}>
								<Text style={styles.summaryLabel}>Mahsulotlar</Text>
								<Text style={styles.summaryValue}>
									{totalPrice.toLocaleString()} so'm
								</Text>
							</View>
							{orderType === 'delivery' && (
								<View style={styles.summaryRow}>
									<Text style={styles.summaryLabel}>Yetkazib berish</Text>
									<Text style={[styles.summaryValue, { color: '#10B981' }]}>
										{deliveryFee > 0
											? `${deliveryFee.toLocaleString()} so'm`
											: 'Bepul'}
									</Text>
								</View>
							)}
							<View style={styles.divider} />
							<View style={styles.totalRow}>
								<Text style={styles.totalLabel}>Jami:</Text>
								<Text style={styles.totalValue}>
									{totalWithDelivery.toLocaleString()} so'm
								</Text>
							</View>

							<TouchableOpacity
								activeOpacity={0.9}
								onPress={() => navigation.navigate('Checkout')}
								style={styles.checkoutButton}
							>
								<Text style={styles.checkoutText}>Buyurtma berish</Text>
								<View style={styles.arrowIcon}>
									<MaterialCommunityIcons
										name='chevron-right'
										size={24}
										color={MAIN_RED}
									/>
								</View>
							</TouchableOpacity>
						</View>
					</View>
				)}
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#FDFCFB', // Warm cozy light background
	},
	container: { flex: 1 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 24,
		paddingBottom: 10,
	},
	headerTitle: { 
		fontSize: 28, 
		fontWeight: '900', 
		color: '#1C1917', // Warm black
		letterSpacing: 0.5,
	},
	orderTypeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
	orderTypeText: { color: '#78716C', fontWeight: '700', fontSize: 13, marginLeft: 4 },
	clearButton: {
		width: 44,
		height: 44,
		borderRadius: 16,
		backgroundColor: '#FFF0F0', // Soft red tint
		alignItems: 'center',
		justifyContent: 'center',
	},
	scroll: { flex: 1, backgroundColor: '#FDFCFB' },
	scrollContent: { padding: 24 },
	emptyContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 60,
	},
	emptyIconContainer: {
		width: 160,
		height: 160,
		borderRadius: 80,
		backgroundColor: '#FFF0F0',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24,
	},
	emptyTitle: { fontSize: 24, fontWeight: '900', color: '#1C1917' },
	emptySubtitle: {
		color: '#78716C',
		fontSize: 15,
		textAlign: 'center',
		marginTop: 12,
		lineHeight: 22,
	},
	backToMenuButton: {
		marginTop: 35,
		backgroundColor: MAIN_RED,
		paddingHorizontal: 40,
		paddingVertical: 18,
		borderRadius: 24,
		shadowColor: MAIN_RED,
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.3,
		shadowRadius: 15,
		elevation: 8,
	},
	backToMenuText: { color: 'white', fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
	sectionLabel: {
		fontSize: 13,
		fontWeight: '800',
		color: '#A8A29E',
		textTransform: 'uppercase',
		letterSpacing: 2,
		marginBottom: 16,
	},
	cartItem: {
		backgroundColor: '#FFFFFF',
		padding: 12,
		borderRadius: 24,
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
		shadowColor: '#1C1917',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.04,
		shadowRadius: 20,
		elevation: 4,
	},
	itemImage: {
		width: 80,
		height: 80,
		borderRadius: 20,
		backgroundColor: '#FAF7F5',
	},
	itemInfo: { flex: 1, marginLeft: 16 },
	itemName: { color: '#1C1917', fontWeight: '800', fontSize: 17, marginBottom: 4 },
	itemPrice: {
		color: '#FF4747', // Vibrant red for pricing (appetizing)
		fontWeight: '800',
		fontSize: 15,
	},
	quantityControl: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFF0F0', // Soft rosy capsule
		borderRadius: 20,
		padding: 4,
	},
	actionButton: {
		width: 34,
		height: 34,
		backgroundColor: '#FFFFFF', // White button inside rosy capsule
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: MAIN_RED,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	quantityText: {
		marginHorizontal: 12,
		fontWeight: '900',
		fontSize: 16,
		color: '#1C1917',
	},
	cartItemsSection: {
		paddingBottom: 20,
	},
	footer: {
		backgroundColor: 'transparent', // Make footer float
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	summaryCard: {
		backgroundColor: '#FFFFFF',
		padding: 24,
		borderRadius: 36, // Exceptionally rounded
		shadowColor: '#1C1917',
		shadowOffset: { width: 0, height: -10 },
		shadowOpacity: 0.06,
		shadowRadius: 30,
		elevation: 15,
	},
	summaryRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	summaryLabel: { color: '#78716C', fontWeight: '600', fontSize: 15 },
	summaryValue: { color: '#1C1917', fontWeight: '800', fontSize: 16 },
	divider: { height: 1.5, backgroundColor: '#F5F5F4', marginVertical: 16 },
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 24,
	},
	totalLabel: { fontSize: 20, fontWeight: '900', color: '#1C1917' },
	totalValue: { fontSize: 26, fontWeight: '900', color: MAIN_RED },
	checkoutButton: {
		backgroundColor: MAIN_RED,
		height: 64,
		borderRadius: 32, // Large pill button
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		shadowColor: MAIN_RED,
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
		elevation: 10,
	},
	checkoutText: { color: 'white', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
	arrowIcon: {
		backgroundColor: 'rgba(255,255,255,0.25)',
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
	},
})

export default CartScreen
