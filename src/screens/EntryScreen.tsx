import { NavigationProp, useNavigation } from '@react-navigation/native'
import React from 'react'
import {
	Dimensions,
	Image,
	Platform,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
	Main: { mode: 'dine-in' | 'delivery' };
};
type Navigation = NavigationProp<RootStackParamList>;

// Premium Colors
const PRIMARY_RED = '#E63946';
const DARK_BG = '#111827';
const LIGHT_BG = '#F9FAFB';

const EntryScreen: React.FC = () => {
	const navigation = useNavigation<Navigation>();

	const handleModeSelect = (mode: 'dine-in' | 'delivery') => {
		navigation.navigate('Main', { mode });
	};

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

			{/* Hero Section */}
			<View style={styles.heroSection}>
				<Image 
					source={{ uri: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1000&auto=format&fit=crop' }} 
					style={styles.heroImage}
				/>
				<View style={styles.overlay} />
				<SafeAreaView style={styles.heroSafeArea}>
					<View style={styles.heroContent}>
						<View style={styles.logoBadge}>
							<Text style={styles.logoText}>A</Text>
						</View>
						<Text style={styles.title}>Afsona</Text>
						<Text style={styles.subtitle}>PREMIUM RESTAURANT</Text>
					</View>
				</SafeAreaView>
			</View>

			{/* Bottom Content */}
			<View style={styles.bottomSection}>
				<View style={styles.handleBar} />
				<Text style={styles.question}>Bugun nima xohlaysiz?</Text>
				<Text style={styles.desc}>Eng sarxil taomlar va yuqori darajadagi xizmatdan bahramand bo'ling</Text>

				<View style={styles.cardStack}>
					{/* Delivery Card */}
					<TouchableOpacity
						style={[styles.card, styles.primaryCard]}
						onPress={() => handleModeSelect('delivery')}
						activeOpacity={0.85}
					>
						<View style={styles.cardRow}>
							<View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
								<Text style={{ fontSize: 24 }}>🛵</Text>
							</View>
							<View style={styles.cardInfo}>
								<Text style={[styles.cardTitle, { color: '#FFF' }]}>Yetkazib berish</Text>
								<Text style={[styles.cardSub, { color: 'rgba(255,255,255,0.8)' }]}>Uyga yoki ofisga</Text>
							</View>
							<View style={styles.arrowBoxDark}>
								<Text style={[styles.cardArrow, { color: '#FFF' }]}>›</Text>
							</View>
						</View>
					</TouchableOpacity>

					{/* Dine-in Card */}
					<TouchableOpacity
						style={[styles.card, styles.secondaryCard]}
						onPress={() => handleModeSelect('dine-in')}
						activeOpacity={0.85}
					>
						<View style={styles.cardRow}>
							<View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
								<Text style={{ fontSize: 24 }}>🍽</Text>
							</View>
							<View style={styles.cardInfo}>
								<Text style={[styles.cardTitle, { color: '#111827' }]}>Restoranda</Text>
								<Text style={[styles.cardSub, { color: '#6B7280' }]}>Stol band qilish</Text>
							</View>
							<View style={styles.arrowBoxLight}>
								<Text style={styles.cardArrow}>›</Text>
							</View>
						</View>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: DARK_BG,
	},
	heroSection: {
		height: height * 0.55,
		width: '100%',
		position: 'relative',
	},
	heroImage: {
		width: '100%',
		height: '100%',
		position: 'absolute',
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0,0,0,0.4)',
	},
	heroSafeArea: {
		flex: 1,
	},
	heroContent: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: Platform.OS === 'android' ? 40 : 0,
	},
	logoBadge: {
		width: 70,
		height: 70,
		borderRadius: 35,
		backgroundColor: PRIMARY_RED,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
		borderWidth: 2,
		borderColor: 'rgba(255,255,255,0.3)',
	},
	logoText: {
		fontSize: 32,
		fontWeight: '900',
		color: '#FFF',
		fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
	},
	title: {
		fontSize: 42,
		fontWeight: '900',
		color: '#FFF',
		letterSpacing: 1,
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 12,
		fontWeight: '800',
		color: 'rgba(255,255,255,0.8)',
		letterSpacing: 4,
	},
	bottomSection: {
		flex: 1,
		backgroundColor: LIGHT_BG,
		marginTop: -30,
		borderTopLeftRadius: 32,
		borderTopRightRadius: 32,
		paddingHorizontal: 24,
		paddingTop: 16,
		alignItems: 'center',
	},
	handleBar: {
		width: 40,
		height: 5,
		borderRadius: 3,
		backgroundColor: '#E5E7EB',
		marginBottom: 24,
	},
	question: {
		fontSize: 24,
		fontWeight: '800',
		color: '#111827',
		marginBottom: 8,
		textAlign: 'center',
	},
	desc: {
		fontSize: 14,
		color: '#6B7280',
		textAlign: 'center',
		marginBottom: 32,
		lineHeight: 20,
		paddingHorizontal: 20,
	},
	cardStack: {
		width: '100%',
		gap: 16,
	},
	card: {
		width: '100%',
		borderRadius: 24,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 5,
	},
	primaryCard: {
		backgroundColor: PRIMARY_RED,
	},
	secondaryCard: {
		backgroundColor: '#FFF',
		borderWidth: 1,
		borderColor: '#F3F4F6',
	},
	cardRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconBox: {
		width: 64,
		height: 64,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	cardInfo: {
		flex: 1,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: '800',
		marginBottom: 4,
	},
	cardSub: {
		fontSize: 13,
		fontWeight: '600',
	},
	arrowBoxDark: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255,255,255,0.2)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	arrowBoxLight: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#F9FAFB',
		alignItems: 'center',
		justifyContent: 'center',
	},
	cardArrow: {
		fontSize: 24,
		color: '#A8A29E',
		fontWeight: '600',
		marginTop: -4,
	},
});

export default EntryScreen;