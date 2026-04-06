import { Category } from './types'

export const CATEGORIES: Category[] = [
	{
    id: 'COMBO',
    name: 'Combo',
    slug: 'combo',
  },
  {
    id: 'XAMIRLI TAOMLAR',
    name: 'Xamirli taomlar',
    slug: 'Xamirli taomlar',
  },
  {
    id: 'SUYUQ OVQATLAR',
    name: 'Suyuq ovqatlar',
    slug: 'Suyuq ovqatlar',
  },
  {
    id: 'SHASHLIK',
    name: 'Kabablar olami',
    slug: 'SHASHLIK',
  },
  {
    id: "MILLIY GO'SHTLI TAOMLAR",
    name: 'Milliy go‘shtli taomlar',
    slug: "MILLIY GO'SHTLI TAOMLAR",
  },
  {
    id: 'BALIQ',
    name: 'Baliq taomlari',
    slug: 'BALIQ',
  },
]

export const FOOD_ITEMS = [
	// Xamirli taomlar
	{
		id: '101',
		name: "Go'sht patir",
		category: 'xamirli-taomlar',
		price: 35000,
		image: 'https://images.unsplash.com/photo-1601050638917-3f3095c2d54e',
	},
	{
		id: '102',
		name: 'Tuxum barak',
		category: 'xamirli-taomlar',
		price: 30000,
		image: 'https://images.unsplash.com/photo-1541529086526-db283c563270',
	},

	// Kabablar olami
	{
		id: '301',
		name: "G'ijduvon shashlik",
		category: 'kabablar-olami',
		price: 18000,
		image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
	},
	{
		id: '302',
		name: 'Qasharli kofte',
		category: 'kabablar-olami',
		price: 22000,
		image: 'https://images.unsplash.com/photo-1529692236671-f1f6e9481bfa',
	},

	// Milliy go'shtli taomlar
	{
		id: '401',
		name: 'Qozon kabob',
		category: 'milliy-goshtli',
		price: 45000,
		image: 'https://images.unsplash.com/photo-1544124499-58912cbddaad',
	},
]

// Rasmlardagi eng xaridorgir taomlardan tashkil topgan Combo Setlar
export const COMBO_SETS = [
	{
		id: 'c1',
		name: "Milliy To'plam",
		description: "Qozon kabob + Mastava + Go'shtli patir + Choy",
		price: 95000,
		image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b',
	},
	{
		id: 'c2',
		name: "Kabab Mix To'plami",
		description: "2 ta G'ijduvon + 2 ta Kuskavoy + Rulet + Issiq non",
		price: 110000,
		image: 'https://images.unsplash.com/photo-1544025162-d76694265947',
	},
	{
		id: 'c3',
		name: 'Somsa Seti',
		description: '5 ta Tandir somsa + 1L Coca-Cola',
		price: 55000,
		image: 'https://images.unsplash.com/photo-1601050638917-3f3095c2d54e',
	},
]
