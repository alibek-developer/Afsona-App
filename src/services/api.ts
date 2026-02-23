import { MOCK_CATEGORIES, MOCK_MENU_ITEMS } from '../lib/mocks'
import { supabase } from '../lib/supabase'

export interface Category {
	id: string
	name: string
	created_at: string
}

export interface MenuItem {
	id: string
	name: string
	price: number
	category: string
	image_url: string
	available_on_mobile: boolean
	is_available: boolean // Bazadagi is_available ustuni
	created_at: string
}

/**
 * Barcha kategoriyalarni olish
 */
export const fetchCategories = async (): Promise<Category[]> => {
	try {
		const { data, error } = await supabase
			.from('categories')
			.select('*')
			.order('name', { ascending: true })

		if (error) throw error
		
		if (!data || data.length === 0) {
			console.warn('⚠️ No categories found in database, using mock data');
			return MOCK_CATEGORIES;
		}

		return data
	} catch (error) {
		console.error('❌ Error fetching categories, using fallback:', error)
		return MOCK_CATEGORIES
	}
}

/**
 * Taomlarni filtrlab olish (Arxivlanmagan va Mobilda ruxsat berilganlar)
 */
export const fetchMenuItemsByCategory = async (
	categoryName?: string,
): Promise<MenuItem[]> => {
	try {
		let query = supabase
			.from('menu_items')
			.select('*')
			.eq('available_on_mobile', true)
			.eq('is_available', true) // Faqat sotuvda bor (arxivlanmagan) taomlar

		if (categoryName && categoryName !== 'all') {
			query = query.ilike('category', categoryName)
		}

		const { data, error } = await query
		if (error) throw error
		
		if (!data || data.length === 0) {
			console.warn(`⚠️ No items found for category: ${categoryName}, using mock data`);
			return MOCK_MENU_ITEMS.filter(item => 
				!categoryName || categoryName === 'all' || item.category.toLowerCase() === categoryName.toLowerCase()
			);
		}

		return data
	} catch (error) {
		console.error('❌ Error fetching menu items, using fallback:', error)
		return MOCK_MENU_ITEMS.filter(item => 
			!categoryName || categoryName === 'all' || item.category.toLowerCase() === categoryName.toLowerCase()
		);
	}
}

export const fetchAllMenuItems = async (): Promise<MenuItem[]> => {
	return fetchMenuItemsByCategory('all')
}
