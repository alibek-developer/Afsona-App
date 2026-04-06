import { MenuItemWithCategory } from '../hooks/useRealtimeOrders'
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS } from '../lib/mocks'
import { supabase } from '../lib/supabase'

export interface Category {
	id: string
	name: string
	created_at: string
}

// Re-export the MenuItemWithCategory type
export type MenuItem = MenuItemWithCategory

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
			console.warn('⚠️ No categories found in database, using mock data')
			return MOCK_CATEGORIES
		}

		return data
	} catch (error) {
		console.error('❌ Error fetching categories, using fallback:', error)
		return MOCK_CATEGORIES
	}
}

/**
 * Fetch menu items with category information
 */
export const fetchMenuItemsWithCategories = async (
	categoryId?: string,
): Promise<MenuItemWithCategory[]> => {
	try {
		let query = supabase
			.from('menu_items')
			.select(
				`
				*,
				categories!menu_items_category_id_fkey(id, name)
			`,
			)
			.eq('available_on_mobile', true)
			.eq('is_available', true)

		if (categoryId && categoryId !== 'all') {
			query = query.eq('category_id', categoryId)
		}

		const { data, error } = await query
		if (error) throw error

		if (!data || data.length === 0) {
			console.warn(`⚠️ No items found, using mock data`)
			const mockItems = MOCK_MENU_ITEMS
			if (categoryId && categoryId !== 'all') {
				return mockItems.filter(item => item.category_id === categoryId)
			}
			return mockItems
		}

		// Transform data to include category_name from the join
		return data.map(item => ({
			...item,
			category_name: (item.categories as any)?.name || item.category_id,
		}))
	} catch (error) {
		console.error('❌ Error fetching menu items, using fallback:', error)
		return MOCK_MENU_ITEMS
	}
}

/**
 * Taomlarni filtrlab olish (Arxivlanmagan va Mobilda ruxsat berilganlar)
 * @deprecated Use fetchMenuItemsWithCategories instead
 */
export const fetchMenuItemsByCategory = async (
	categoryName?: string,
): Promise<MenuItem[]> => {
	// For backward compatibility, return all items if no category filter
	// The new system uses category_id not category name
	return fetchMenuItemsWithCategories(
		categoryName === 'all' ? undefined : categoryName,
	)
}

export const fetchAllMenuItems = async (): Promise<MenuItem[]> => {
	return fetchMenuItemsWithCategories()
}
