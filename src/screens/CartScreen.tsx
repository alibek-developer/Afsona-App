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

const MAIN_RED = '#FF0000'

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
		backgroundColor: '#FFFFFF',
	},
	container: { flex: 1 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
	},
	headerTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
	orderTypeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
	orderTypeText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
	clearButton: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: '#FEF2F2',
		alignItems: 'center',
		justifyContent: 'center',
	},
	scroll: { flex: 1, backgroundColor: '#F9FAFB' },
	scrollContent: { padding: 20 },
	emptyContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 60,
	},
	emptyIconContainer: {
		width: 150,
		height: 150,
		borderRadius: 75,
		backgroundColor: '#F3F4F6',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 20,
	},
	emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
	emptySubtitle: {
		color: '#9CA3AF',
		fontSize: 15,
		textAlign: 'center',
		marginTop: 10,
		lineHeight: 22,
	},
	backToMenuButton: {
		marginTop: 30,
		backgroundColor: MAIN_RED,
		paddingHorizontal: 40,
		paddingVertical: 16,
		borderRadius: 18,
		shadowColor: MAIN_RED,
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.2,
		shadowRadius: 10,
		elevation: 5,
	},
	backToMenuText: { color: 'white', fontWeight: '800', fontSize: 16 },
	sectionLabel: {
		fontSize: 12,
		fontWeight: '800',
		color: '#9CA3AF',
		textTransform: 'uppercase',
		letterSpacing: 1,
		marginBottom: 15,
	},
	cartItem: {
		backgroundColor: 'white',
		padding: 12,
		borderRadius: 20,
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 5,
		elevation: 2,
	},
	itemImage: {
		width: 75,
		height: 75,
		borderRadius: 15,
		backgroundColor: '#F3F4F6',
	},
	itemInfo: { flex: 1, marginLeft: 15 },
	itemName: { color: '#111827', fontWeight: '700', fontSize: 16 },
	itemPrice: {
		color: '#6B7280',
		fontWeight: '600',
		marginTop: 4,
		fontSize: 14,
	},
	quantityControl: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F3F4F6',
		borderRadius: 15,
		padding: 4,
	},
	actionButton: {
		width: 32,
		height: 32,
		backgroundColor: 'white',
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	quantityText: {
		marginHorizontal: 12,
		fontWeight: '800',
		fontSize: 15,
		color: '#111827',
	},
	cartItemsSection: {
		padding: 20,
	},
	footer: {
		backgroundColor: '#F9FAFB',
		paddingHorizontal: 20,
		paddingTop: 20,
		borderTopLeftRadius: 30,
		borderTopRightRadius: 30,
	},
	summaryCard: {
		backgroundColor: 'white',
		padding: 20,
		borderRadius: 25,
		shadowColor: '#fff',
		shadowOffset: { width: 0, height: -5 },
		shadowOpacity: 0.05,
		shadowRadius: 15,
		elevation: 10,
	},
	summaryRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	summaryLabel: { color: '#9CA3AF', fontWeight: '600' },
	summaryValue: { color: '#111827', fontWeight: '700' },
	divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 15 },
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	totalLabel: { fontSize: 18, fontWeight: '800', color: '#111827' },
	totalValue: { fontSize: 20, fontWeight: '900', color: MAIN_RED },
	checkoutButton: {
		backgroundColor: MAIN_RED,
		height: 60,
		borderRadius: 20,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
	},
	checkoutText: { color: 'white', fontWeight: '800', fontSize: 18 },
	arrowIcon: {
		backgroundColor: 'white',
		width: 30,
		height: 30,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
})

export default CartScreen
