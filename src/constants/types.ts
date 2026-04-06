export interface FoodItem {
	id: string
	name: string
	description: string
	price: number
	image: string
	rating?: number
	category: string
}

export interface Category {
	id: string
	name: string
	slug: string
	created_at?: string
}

export interface CartItem extends FoodItem {
	quantity: number
}

// BAZA BILAN ISHLAYDIGAN ASOSIY INTERFEYS
export interface Order {
	id: string
	created_at: string
	customer_name: string
	phone: string
	delivery_address: string | null
	latitude: number | null
	longitude: number | null
	order_type: 'delivery' | 'dine-in'
	status: 'new' | 'accepted' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled'
	total_amount: number
	payment_method?: string
}

// Order items are stored in separate order_items table, not in Order interface
// Use order.order_items to access items
