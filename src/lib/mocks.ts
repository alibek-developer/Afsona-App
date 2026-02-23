import { Order } from '../hooks/useRealtimeOrders';
import { Category, MenuItem } from '../services/api';

// ===== MOCK CATEGORIES =====
export const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Xamirli taomlar', created_at: new Date().toISOString() },
  { id: '2', name: 'Suyuq ovqatlar', created_at: new Date().toISOString() },
  { id: '3', name: 'Shashliklar', created_at: new Date().toISOString() },
  { id: '4', name: 'Milliy go\'shtli taomlar', created_at: new Date().toISOString() },
];

// ===== MOCK MENU ITEMS =====
export const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: "Go'sht patir",
    price: 35000,
    category: 'Xamirli taomlar',
    image_url: 'https://images.unsplash.com/photo-1601050638917-3f3095c2d54e',
    available_on_mobile: true,
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'm2',
    name: 'Mastava',
    price: 25000,
    category: 'Suyuq ovqatlar',
    image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
    available_on_mobile: true,
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'm3',
    name: "G'ijduvon shashlik",
    price: 18000,
    category: 'Shashliklar',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
    available_on_mobile: true,
    is_available: true,
    created_at: new Date().toISOString()
  }
];

// ===== MOCK ORDERS =====
export const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'yangi',
    items: [
      { id: 'm1', name: "Go'sht patir", quantity: 2, price: 35000 }
    ],
    total_amount: 70000,
    type: 'delivery',
    customer_name: 'Demo User',
    customer_phone: '+998 90 123 45 67',
    delivery_address: 'Tashkent, Amir Temur street, 15'
  }
];

// ===== MOCK TABLES/ROOMS =====
export interface MockTable {
  id: string;
  name: string;
  capacity: number;
  price_per_hour: number;
  image_url: string;
  is_available: boolean;
  description: string;
}

export const MOCK_TABLES: MockTable[] = [
  {
    id: 't1',
    name: 'VIP Xona 1',
    capacity: 10,
    price_per_hour: 100000,
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
    is_available: true,
    description: 'Katta oilalar uchun maxsus xona'
  },
  {
    id: 't2',
    name: 'Standard Table',
    capacity: 4,
    price_per_hour: 0,
    image_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9',
    is_available: true,
    description: 'Markaziy zaldagi stol'
  }
];
