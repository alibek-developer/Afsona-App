import { NavigationContainer } from '@react-navigation/native'
import { Component, ErrorInfo, ReactNode, useEffect } from 'react'
import { Text, View } from 'react-native'
import 'react-native-gesture-handler'
import 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { CartProvider } from './src/context/CartContext'
import { CourierLocationProvider } from './src/context/CourierLocationContext'
import { OrderProvider } from './src/context/OrderContext'
import './src/global.css'
import AppNavigator from './src/navigation/AppNavigator'

console.log("🚀 [APP STARTED] Global scope initialized");

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("❌ CRITICAL APP CRASH:", error);
		console.error("📄 STACK TRACE:", errorInfo.componentStack);
	}

	render() {
		if (this.state.hasError) {
			return (
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 }}>
					<Text style={{ color: '#ff4444', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Something went wrong.</Text>
					<Text style={{ color: '#fff', textAlign: 'center' }}>{this.state.error?.toString()}</Text>
				</View>
			);
		}

		return this.props.children;
	}
}

// Inner component to access auth context
const AppContent = () => {
	const { user } = useAuth()
	
	return (
		<CourierLocationProvider courierId={user?.id || ''}>
			<OrderProvider>
				<CartProvider>
					<NavigationContainer>
						<AppNavigator />
					</NavigationContainer>
				</CartProvider>
			</OrderProvider>
		</CourierLocationProvider>
	)
}

export default function App() {
	useEffect(() => {
		console.log("📱 [APP MOUNTED] App component mounted");
	}, [])

	return (
		<ErrorBoundary>
			<SafeAreaProvider style={{ flex: 1 }}>
				<AuthProvider>
					<AppContent />
				</AuthProvider>
				<Toast />
			</SafeAreaProvider>
		</ErrorBoundary>
	)
}
