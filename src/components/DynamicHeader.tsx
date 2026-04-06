import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useCart } from '../context/CartContext'

interface DynamicHeaderProps {
	orderType: 'delivery' | 'dine-in'
	tableNumber?: string
	onTablePress?: () => void
}

const DynamicHeader: React.FC<DynamicHeaderProps> = ({
	orderType,
	tableNumber,
	onTablePress,
}) => {
	const navigation = useNavigation<any>()
	const { cartItems } = useCart()
	const itemCount = cartItems.length

	return (
		<View style={styles.container}>
			{/* Top Row: Table Info & Cart */}
			<View style={styles.topRow}>
				{/* Table Button - Only show for dine-in */}
				{orderType === 'dine-in' ? (
					<TouchableOpacity onPress={onTablePress} style={styles.tableButton}>
						<Text style={styles.tableIcon}>🍴</Text>
						<Text style={styles.tableText}>Stol #{tableNumber || '12'}</Text>
					</TouchableOpacity>
				) : (
					<View style={styles.placeholder} />
				)}

				{/* Cart Button */}
				<TouchableOpacity
					onPress={() => navigation.navigate('Savat')}
					style={styles.cartButton}
				>
					<Text style={styles.cartIcon}>🛒</Text>
					{itemCount > 0 && (
						<View style={styles.badge}>
							<Text style={styles.badgeText}>{itemCount}</Text>
						</View>
					)}
				</TouchableOpacity>
			</View>

			{/* Search Row */}
			<View style={styles.searchRow}>
				<Text style={styles.searchIcon}>🔍</Text>
				<Text style={styles.searchPlaceholder}>Taomlarni izlash...</Text>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 16,
		paddingTop: 48, // Status bar height
		paddingBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 2,
	},
	topRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	tableButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F5F5F5',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
	},
	tableIcon: {
		fontSize: 16,
		marginRight: 6,
	},
	tableText: {
		fontSize: 14,
		fontWeight: '700',
		color: '#2D3436',
	},
	placeholder: {
		width: 80, // Same width as table button for balance
	},
	cartButton: {
		position: 'relative',
		padding: 8,
		backgroundColor: '#F5F5F5',
		borderRadius: 20,
	},
	cartIcon: {
		fontSize: 20,
	},
	badge: {
		position: 'absolute',
		top: -4,
		right: -4,
		backgroundColor: '#FF6B01',
		width: 20,
		height: 20,
		borderRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: '#FFFFFF',
	},
	badgeText: {
		color: '#FFFFFF',
		fontSize: 10,
		fontWeight: 'bold',
	},
	searchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F5F5F5',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 20,
	},
	searchIcon: {
		fontSize: 18,
		marginRight: 8,
	},
	searchPlaceholder: {
		flex: 1,
		fontSize: 16,
		color: '#95A5A6',
	},
})

export default DynamicHeader
