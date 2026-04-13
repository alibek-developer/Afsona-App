import { NavigationProp, useNavigation } from '@react-navigation/native'
import React from 'react'
import {
	Dimensions,
	Platform,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'

const { width } = Dimensions.get('window');

// 🔹 Navigation tipi
type RootStackParamList = {
	Main: { mode: 'dine-in' | 'delivery' };
};
type Navigation = NavigationProp<RootStackParamList>;

const MAIN_RED = '#FF4747';

const EntryScreen: React.FC = () => {
	const navigation = useNavigation<Navigation>();

	const handleModeSelect = (mode: 'dine-in' | 'delivery') => {
		navigation.navigate('Main', { mode });
	};

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

			{/* Sokin fonga nisbatan orqa ko'rinish */}
			<View style={styles.backgroundAccent} />

			<View style={styles.content}>
				{/* 🏷️ Header & Logo */}
				<View style={styles.header}>
					<View style={styles.logoBadge}>
						<Text style={styles.logoText}>🔥</Text>
					</View>
					<Text style={styles.title}>Afsona</Text>
					<Text style={styles.subtitle}>Premium Restoran</Text>
					<Text style={styles.question}>Bugun qanday buyurtma qilamiz?</Text>
				</View>

				{/* 📦 Tanlash kartochkalari */}
				<View style={styles.cardStack}>
					{/* Yetkazib berish (Asosiy action) */}
					<TouchableOpacity
						style={[styles.card, styles.primaryCard]}
						onPress={() => handleModeSelect('delivery')}
						activeOpacity={0.9}
					>
						<View style={styles.cardRow}>
							<View style={[styles.cardIconBox, styles.primaryIconBox]}>
								<Text style={styles.primaryIcon}>🛵</Text>
							</View>
							<View style={styles.cardInfo}>
								<Text style={[styles.cardTitle, styles.primaryTitle]}>Yetkazib berish</Text>
								<Text style={[styles.cardDesc, styles.primaryDesc]}>Issiqqina uyingizgacha</Text>
							</View>
							<View style={styles.arrowBoxLight}>
								<Text style={[styles.cardArrow, styles.primaryArrow]}>›</Text>
							</View>
						</View>
					</TouchableOpacity>

					{/* Restoran ichida */}
					<TouchableOpacity
						style={styles.card}
						onPress={() => handleModeSelect('dine-in')}
						activeOpacity={0.85}
					>
						<View style={styles.cardRow}>
							<View style={styles.cardIconBox}>
								<Text style={styles.cardIcon}>🍽</Text>
							</View>
							<View style={styles.cardInfo}>
								<Text style={styles.cardTitle}>Restoran ichida</Text>
								<Text style={styles.cardDesc}>Stolingizga xizmat qilamiz</Text>
							</View>
							<View style={styles.arrowBoxDark}>
								<Text style={styles.cardArrow}>›</Text>
							</View>
						</View>
					</TouchableOpacity>
				</View>

				{/* 🔻 Footer */}
				<Text style={styles.footer}>
					Xush kelibsiz! Har bir detalliga mehr berilgan.
				</Text>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FDFCFB',
	},
	backgroundAccent: {
		position: 'absolute',
		top: -150,
		left: -50,
		width: width * 1.5,
		height: width * 1.5,
		borderRadius: width * 0.75,
		backgroundColor: '#FFF0F0',
		opacity: 0.8,
	},
	content: {
		flex: 1,
		paddingHorizontal: 24,
		justifyContent: 'center',
		paddingBottom: 20,
	},
	header: {
		alignItems: 'center',
		marginBottom: 48,
	},
	logoBadge: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: MAIN_RED,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: MAIN_RED,
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.3,
		shadowRadius: 15,
		elevation: 8,
		marginBottom: 20,
	},
	logoText: {
		fontSize: 36,
	},
	title: {
		fontSize: 32,
		fontWeight: '900',
		color: '#1C1917',
		letterSpacing: -0.5,
		marginBottom: 2,
	},
	subtitle: {
		fontSize: 15,
		color: '#A8A29E',
		fontWeight: '800',
		letterSpacing: 2,
		textTransform: 'uppercase',
		marginBottom: 24,
	},
	question: {
		fontSize: 20,
		fontWeight: '800',
		color: '#1C1917',
		textAlign: 'center',
	},
	cardStack: {
		gap: 20,
	},
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 36,
		padding: 12,
		shadowColor: '#1C1917',
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.04,
		shadowRadius: 20,
		elevation: 5,
		borderWidth: 1,
		borderColor: 'rgba(0,0,0,0.02)',
	},
	primaryCard: {
		backgroundColor: MAIN_RED,
		shadowColor: MAIN_RED,
		shadowOpacity: 0.25,
	},
	cardRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	cardIconBox: {
		width: 60,
		height: 60,
		borderRadius: 24,
		backgroundColor: '#F5F5F4',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	primaryIconBox: {
		backgroundColor: 'rgba(255,255,255,0.2)',
	},
	cardIcon: { fontSize: 26 },
	primaryIcon: { fontSize: 26 },
	cardInfo: { flex: 1 },
	cardTitle: {
		fontSize: 18,
		fontWeight: '800',
		color: '#1C1917',
		marginBottom: 4,
	},
	primaryTitle: { color: '#FFFFFF' },
	cardDesc: {
		fontSize: 13,
		color: '#78716C',
		fontWeight: '600',
	},
	primaryDesc: { color: 'rgba(255,255,255,0.9)' },
	arrowBoxDark: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: '#FAF7F5',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 6,
	},
	arrowBoxLight: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: 'rgba(255,255,255,0.2)',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 6,
	},
	cardArrow: {
		fontSize: 24,
		color: '#A8A29E',
		fontWeight: '600',
		marginTop: -4,
	},
	primaryArrow: { color: '#FFFFFF' },
	footer: {
		textAlign: 'center',
		fontSize: 13,
		color: '#A8A29E',
		marginTop: 'auto',
		marginBottom: Platform.OS === 'ios' ? 10 : 20,
		fontWeight: '700',
	},
});

export default EntryScreen;