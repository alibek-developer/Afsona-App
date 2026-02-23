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
	phone: string // customer_phone emas, phone deb o'zgartirildi
	delivery_address: string | null
	latitude: number | null
	longitude: number | null
	type: 'delivery' | 'dine-in' // mode emas, bazadagi type ishlatiladi
	status: 'yangi' | 'tayyorlanmoqda' | 'tayyor' | 'yakunlandi'
	items: CartItem[] // jsonb formatida saqlanadi
	total_amount: number // total emas, total_amount
	table_number?: string // optional for dine-in
	payment_method?: string // optional field
}
