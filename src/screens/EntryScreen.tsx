import { useNavigation } from '@react-navigation/native'
import React from 'react'
import {
	Dimensions,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'

const { width, height } = Dimensions.get('window')

const EntryScreen = () => {
	const navigation = useNavigation<any>()

	const handleModeSelect = (mode: 'dine-in' | 'delivery') => {
		navigation.navigate('Main', { mode })
	}

	return (
		<View style={styles.container}>
			{/* Background with gradient effect using View */}
			<View style={styles.backgroundGradient} />

			{/* Content */}
			<View style={styles.content}>
				{/* Logo/Title */}
				<View style={styles.titleContainer}>
					<Text style={styles.logo}>FoodFlow</Text>
					<Text style={styles.subtitle}>Tezkor va mazali taomlar</Text>
				</View>

				{/* Selection Buttons */}
				<View style={styles.buttonContainer}>
					{/* Dine-in Button */}
					<TouchableOpacity
						style={[styles.glassButton, styles.dineInButton]}
						onPress={() => handleModeSelect('dine-in')}
						activeOpacity={0.8}
					>
						<View style={styles.buttonContent}>
							<Text style={styles.buttonIcon}>🍴</Text>
							<Text style={styles.buttonTitle}>Restoran ichida</Text>
							<Text style={styles.buttonDescription}>O'tirib ovqatlanish</Text>
						</View>
					</TouchableOpacity>

					{/* Delivery Button */}
					<TouchableOpacity
						style={[styles.glassButton, styles.deliveryButton]}
						onPress={() => handleModeSelect('delivery')}
						activeOpacity={0.8}
					>
						<View style={styles.buttonContent}>
							<Text style={styles.buttonIcon}>🛵</Text>
							<Text style={styles.buttonTitle}>Yetkazib berish</Text>
							<Text style={styles.buttonDescription}>Uyingizga yetkazamiz</Text>
						</View>
					</TouchableOpacity>
				</View>

				{/* Footer */}
				<View style={styles.footer}>
					<Text style={styles.footerText}>
						© 2024 FoodFlow. Barcha huquqlar himoyalangan.
					</Text>
				</View>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FF6B01',
	},
	backgroundGradient: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		height: height * 0.6,
		backgroundColor: '#FF8C42',
		opacity: 0.8,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
	},
	titleContainer: {
		alignItems: 'center',
		marginBottom: 80,
	},
	logo: {
		fontSize: 48,
		fontWeight: '800',
		color: '#FFFFFF',
		marginBottom: 8,
		textShadowColor: 'rgba(0, 0, 0, 0.1)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
	},
	subtitle: {
		fontSize: 16,
		color: 'rgba(255, 255, 255, 0.9)',
		fontWeight: '500',
	},
	buttonContainer: {
		width: '100%',
		gap: 20,
	},
	glassButton: {
		width: '100%',
		height: 140,
		borderRadius: 24,
		backgroundColor: 'rgba(255, 255, 255, 0.15)',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.2)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.1,
		shadowRadius: 16,
		elevation: 8,
	},
	dineInButton: {
		backgroundColor: 'rgba(255, 255, 255, 0.25)',
	},
	deliveryButton: {
		backgroundColor: 'rgba(255, 255, 255, 0.15)',
	},
	buttonContent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20,
	},
	buttonIcon: {
		fontSize: 40,
		marginBottom: 12,
	},
	buttonTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#FFFFFF',
		marginBottom: 4,
		textAlign: 'center',
	},
	buttonDescription: {
		fontSize: 14,
		color: 'rgba(255, 255, 255, 0.8)',
		textAlign: 'center',
		fontWeight: '500',
	},
	footer: {
		position: 'absolute',
		bottom: 40,
		alignItems: 'center',
	},
	footerText: {
		fontSize: 12,
		color: 'rgba(255, 255, 255, 0.7)',
		fontWeight: '500',
	},
})

export default EntryScreen
