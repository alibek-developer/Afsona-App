import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

console.log("🔗 [SUPABASE] Initializing client...");

// 1. O'zgaruvchilarni olish
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// 2. Agar o'zgaruvchilar yo'q bo'lsa, ilova butunlay to'xtab qolmasligi uchun va qizil/ko'k ekran bermasligi uchun tekshiruv:
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ SUPABASE ERROR: .env fayli topilmadi yoki kalitlar xato!")
}

// 3. Supabase mijozini yaratish
// Agar kalitlar bo'lmasa, undefined o'rniga bo'sh string beramizki, 'create' xatosi chiqmasin
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)

// 4. Ulanishni tekshirish
export const checkConnection = async () => {
  if (!supabaseUrl) return { status: 'error', message: 'URL missing' }
  
  try {
    const { data, error } = await supabase.from('menu_items').select('id').limit(1)
    if (error) throw error
    console.log('✅ Supabase ulanishi muvaffaqiyatli!')
    return { status: 'ok', data }
  } catch (err: any) {
    console.log('⚠️ Supabase ulanishida muammo:', err.message)
    return { status: 'error', message: err.message }
  }
}

checkConnection()