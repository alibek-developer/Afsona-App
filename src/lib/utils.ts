import { RESTAURANT_LOCATION } from './constants'

/**
 * Narxni formatlash
 * 60000 -> "60 000 so'm"
 */
export const formatPrice = (price: number | null | undefined): string => {
  const numPrice = price ?? 0;
  return new Intl.NumberFormat('fr-FR').format(numPrice).replace(',', ' ') + " so'm";
};

/**
 * Masofani hisoblash (Haversine)
 */
export function calculateDistance(lat: number, lng: number): number {
  if (!lat || !lng || !Number.isFinite(lat) || !Number.isFinite(lng)) return 0;

  const restaurantLat = RESTAURANT_LOCATION.lat;
  const restaurantLng = RESTAURANT_LOCATION.lng;

  const R = 6371; // Yer radiusi
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat - restaurantLat);
  const dLng = toRad(lng - restaurantLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(restaurantLat)) *
      Math.cos(toRad(lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Masofa 0.1 km dan kichik bo'lsa 0 qaytarmaslik uchun
  return Math.round(distance * 10) / 10;
}

/**
 * Yetkazib berish narxi
 */
export function calculateDeliveryFee(
  distance: number,
  subtotal: number = 0, // Default qiymat
): number {
  const dist = Number(distance) || 0;

  if (dist <= 0) return 0;

  // 0 dan 3 km gacha: 5,000 so'm
  if (dist <= 3) return 5000;

  // 3 km dan oshsa: 5,000 + har bir km uchun 2,000
  // Math.ceil ishlatish yaxshi (3.2 km bo'lsa 4 km deb hisoblaydi)
  const additionalKm = Math.ceil(dist - 3);
  return 5000 + (additionalKm * 2000);
}

/**
 * Buyurtma ID
 */
export function generateOrderId(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}