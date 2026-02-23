import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useCart } from '../context/CartContext'
import { COLORS } from '../theme/colors'

interface HeaderProps {
	title?: string
	orderType?: 'delivery' | 'dine-in'
	tableNumber?: string
	onTablePress?: () => void
}

export const Header = ({
	title = 'Menu',
	orderType = 'delivery',
	tableNumber,
	onTablePress,
}: HeaderProps) => {
	const navigation = useNavigation<any>()
	const { cartItems } = useCart()
	const itemCount = cartItems.length

	return (
		<View className='bg-white px-4 pt-12 pb-4 shadow-sm'>
			{/* Top Row: Table Info & Cart */}
			<View className='flex-row justify-between items-center mb-4'>
				{/* Table Button - Only show for dine-in */}
				{orderType === 'dine-in' ? (
					<TouchableOpacity
						onPress={onTablePress}
						className='flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full'
					>
						<MaterialCommunityIcons
							name='silverware'
							size={16}
							color={COLORS.primary}
						/>
						<Text className='ml-2 font-bold text-gray-800'>
							Stol #{tableNumber || '12'}
						</Text>
					</TouchableOpacity>
				) : (
					<View className='w-20' /> // Placeholder for balance
				)}

				<TouchableOpacity
					onPress={() => navigation.navigate('Savat')}
					className='p-2 bg-gray-100 rounded-full'
				>
					<MaterialCommunityIcons
						name='shopping-outline'
						size={24}
						color='black'
					/>
					{itemCount > 0 && (
						<View className='absolute -top-1 -right-1 bg-primary w-5 h-5 rounded-full items-center justify-center border-2 border-white'>
							<Text className='text-white text-[10px] font-bold'>
								{itemCount}
							</Text>
						</View>
					)}
				</TouchableOpacity>
			</View>

			{/* Search Row */}
			<View className='flex-row items-center bg-gray-100 px-4 py-3 rounded-2xl'>
				<MaterialCommunityIcons name='magnify' size={22} color='gray' />
				<TextInput
					placeholder='Taomlarni izlash...'
					className='flex-1 ml-3 text-base text-gray-800'
					placeholderTextColor='gray'
				/>
			</View>
		</View>
	)
}
