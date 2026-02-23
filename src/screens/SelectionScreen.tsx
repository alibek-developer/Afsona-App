import { MaterialCommunityIcons } from '@expo/vector-icons'
import {
    Animated,
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useOrder } from '../context/OrderContext'

const { width, height } = Dimensions.get('window')
const MAIN_RED = '#FF0000'

const SelectionScreen = ({ navigation }: { navigation: any }) => {
	const { setOrderType } = useOrder()

	// Bosish animatsiyasi uchun (Scale effect)
	const scaleAnim = new Animated.Value(1)

	const handleSelection = (type: 'delivery' | 'dine-in') => {
		setOrderType(type)
		navigation?.navigate('Main')
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<StatusBar
				barStyle='dark-content'
				backgroundColor='transparent'
				translucent
			/>

			{/* Orqa fondagi xira qizil "shira" (Gradient o'rniga minimal usul) */}
			<View style={styles.bgCircle} />

			<View style={styles.container}>
				{/* Logo qismi */}
				<View style={styles.logoSection}>
					<View style={styles.iconWrapper}>
						<MaterialCommunityIcons
							name='silverware-variant'
							size={60}
							color='white'
						/>
					</View>
					<Text style={styles.brandName}>Afsona Restoran</Text>
					<Text style={styles.tagline}>Bugun qanday buyurtma qilamiz?</Text>
				</View>

				{/* Tanlov qismi */}
				<View style={styles.optionsContainer}>
					{/* Restoran ichida */}
					<TouchableOpacity
						activeOpacity={0.9}
						onPress={() => handleSelection('dine-in')}
						style={styles.mainCard}
					>
						<View style={styles.cardInfo}>
							<Text style={styles.cardTitle}>Restoran ichida</Text>
							<Text style={styles.cardDesc}>Stolingizga yetkazib beramiz</Text>
						</View>
						<View style={styles.cardIconBox}>
							<MaterialCommunityIcons
								name='storefront-outline'
								size={32}
								color={MAIN_RED}
							/>
						</View>
					</TouchableOpacity>

					{/* Yetkazib berish */}
					<TouchableOpacity
						activeOpacity={0.9}
						onPress={() => handleSelection('delivery')}
						style={[styles.mainCard, styles.deliveryCard]}
					>
						<View style={styles.cardInfo}>
							<Text style={[styles.cardTitle, { color: 'white' }]}>
								Yetkazib berish
							</Text>
							<Text
								style={[styles.cardDesc, { color: 'rgba(255,255,255,0.7)' }]}
							>
								Uyingizgacha issiq holda
							</Text>
						</View>
						<View
							style={[
								styles.cardIconBox,
								{ backgroundColor: 'rgba(255,255,255,0.2)' },
							]}
						>
							<MaterialCommunityIcons
								name='moped-outline'
								size={32}
								color='white'
							/>
						</View>
					</TouchableOpacity>
				</View>

				{/* Pastki promo */}
				<View style={styles.footer}>
					<Text style={styles.footerText}>
						Xush kelibsiz! Biz siz uchun doim tayyormiz.
					</Text>
				</View>
			</View>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
	bgCircle: {
		position: 'absolute',
		top: -width * 0.4,
		right: -width * 0.2,
		width: width,
		height: width,
		borderRadius: width / 2,
		backgroundColor: '#FFF1F1', // Juda och qizil
		zIndex: -1,
	},
	container: {
		flex: 1,
		paddingHorizontal: 30,
		justifyContent: 'space-around',
		paddingVertical: 50,
	},
	logoSection: {
		alignItems: 'center',
	},
	iconWrapper: {
		width: 100,
		height: 100,
		backgroundColor: MAIN_RED,
		borderRadius: 35,
		alignItems: 'center',
		justifyContent: 'center',
		transform: [{ rotate: '45deg' }], // Ramzni 45 gradusga burish (Trend dizayn)
		shadowColor: MAIN_RED,
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
		elevation: 10,
	},
	brandName: {
		fontSize: 40,
		fontWeight: '900',
		color: '#111827',
		marginTop: 40,
		letterSpacing: -1.5,
	},
	tagline: {
		fontSize: 16,
		color: '#6B7280',
		marginTop: 10,
		fontWeight: '500',
	},
	optionsContainer: {
		gap: 20,
		width: '100%',
	},
	mainCard: {
		backgroundColor: 'white',
		padding: 24,
		borderRadius: 30,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderWidth: 1,
		borderColor: '#F3F4F6',
		// Soft shadow
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 15 },
		shadowOpacity: 0.05,
		shadowRadius: 20,
		elevation: 5,
	},
	deliveryCard: {
		backgroundColor: MAIN_RED,
		borderColor: MAIN_RED,
		shadowColor: MAIN_RED,
		shadowOpacity: 0.2,
	},
	cardInfo: { flex: 1 },
	cardTitle: {
		fontSize: 22,
		fontWeight: '800',
		color: '#111827',
		marginBottom: 5,
	},
	cardDesc: {
		fontSize: 14,
		color: '#9CA3AF',
	},
	cardIconBox: {
		width: 60,
		height: 60,
		backgroundColor: '#FFF1F1',
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	footer: {
		alignItems: 'center',
	},
	footerText: {
		color: '#D1D5DB',
		fontSize: 12,
		fontWeight: '600',
	},
})

export default SelectionScreen
