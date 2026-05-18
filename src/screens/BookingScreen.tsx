import {
  Calendar,
  Clock,
  MapPin,
  Minus,
  Plus,
  Users,
  X,
  Check,
  ChevronLeft,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ===== TYPES =====
interface BookingVenue {
  id: string;
  name: string;
  capacity: number;
  price_per_hour: number;
  image_url: string;
  is_available: boolean;
  description?: string;
  type: 'vip' | 'hall' | 'terrace';
  typeLabel: string;
  floor: number;
  branch_id: string;
}

interface BookingFormData {
  customer_name: string;
  phone: string;
  notes: string;
}

// ===== CONSTANTS =====
const PRIMARY_RED = '#E63946'; // Premium Coral Red
const BG_LIGHT = '#F9FAFB'; // Soft grey page background
const CARD_BG = '#FFFFFF';
const TEXT_DARK = '#111827'; // Dark main text
const TEXT_GRAY = '#6B7280'; // Slate grey
const BORDER_COLOR = '#E5E7EB';
const ACCENT_GREEN = '#10B981'; // Emerald for Bo'sh
const ACCENT_GRAY = '#9CA3AF'; // Muted for Band

const TIMES = ["12:00", "13:00", "14:00", "18:00", "19:00", "20:00", "21:00", "22:00"];

const BookingScreen = () => {
  const { user } = useAuth();
  const [venues, setVenues] = useState<BookingVenue[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Multi-step Sheet Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<BookingVenue | null>(null);
  const [step, setStep] = useState<1 | 2 | 'success'>(1);

  // Dynamic Date Pre-generation (Next 7 days from Today)
  const daysData = useMemo(() => {
    const weekDays = ["Ya", "Du", "Se", "Cho", "Pa", "Ju", "Sh"];
    const result = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = weekDays[date.getDay()];
      const dayOfMonth = date.getDate();
      const monthLabel = date.toLocaleDateString('uz-UZ', { month: 'short' });
      result.push({
        dayLabel: dayOfWeek,
        dayNum: dayOfMonth,
        monthLabel,
        date: date,
      });
    }
    return result;
  }, []);

  // Reservation Form State
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState("19:00");
  const [guestsCount, setGuestsCount] = useState(4);
  const [formData, setFormData] = useState<BookingFormData>({
    customer_name: '',
    phone: '+998 ',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const submittingRef = useRef(false);

  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const checkVenueAvailability = async (venueId: string, dateStr: string) => {
    try {
      setCheckingAvailability(true);
      const { data, error } = await supabase
        .from('table_reservations')
        .select('start_time')
        .eq('table_id', venueId)
        .eq('reservation_date', dateStr)
        .neq('status', 'cancelled');

      if (error) throw error;

      const times = (data || []).map((res: any) => {
        const parts = res.start_time.split(':');
        return `${parts[0]}:${parts[1]}`;
      });
      setBookedTimes(times);
    } catch (err) {
      console.error('Error checking availability:', err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  useEffect(() => {
    if (selectedVenue) {
      const dateStr = daysData[selectedDayIndex].date.toISOString().split('T')[0];
      checkVenueAvailability(selectedVenue.id, dateStr);
    }
  }, [selectedVenue, selectedDayIndex]);

  useEffect(() => {
    if (bookedTimes.includes(selectedTime)) {
      const available = TIMES.find(t => !bookedTimes.includes(t));
      if (available) {
        setSelectedTime(available);
      } else {
        setSelectedTime("");
      }
    }
  }, [bookedTimes]);

  // Animated Sheet values
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Auto-fill logged-in user profile if exists
  useEffect(() => {
    if (user) {
      const nameGuess = user.email ? user.email.split('@')[0] : '';
      setFormData(prev => ({
        ...prev,
        customer_name: nameGuess.charAt(0).toUpperCase() + nameGuess.slice(1),
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);

      const { data: bData } = await supabase.from('branches').select('id').limit(1);
      const defaultBranchId =
        bData && bData.length > 0 ? bData[0].id : '00000000-0000-0000-0000-000000000000';

      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('is_available', true)
        .order('name', { ascending: true });

      if (error) throw error;

      const mappedData: BookingVenue[] = (data || []).map((item: any) => {
        const lowerName = item.name.toLowerCase();
        const type = (lowerName.includes('vip') || lowerName.includes('xona')) ? 'vip' :
                     (lowerName.includes('zal') || lowerName.includes('hall') || lowerName.includes('tantana') || lowerName.includes('marosim')) ? 'hall' : 'table';
        const typeLabel = type === 'vip' ? 'Xona' : type === 'hall' ? 'Marosimlar Zali' : 'Stol';

        return {
          id: item.id,
          name: item.name,
          capacity: item.capacity || 4,
          price_per_hour: item.price_per_hour || 0,
          image_url: item.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80',
          is_available: item.is_available ?? true,
          description: item.description || (type === 'vip' ? 'Barcha sharoitlarga ega maxsus shinam xona' : type === 'hall' ? 'To\'y va katta marosimlar uchun mo\'ljallangan katta tantanalar zali' : 'Barcha qulayliklarga ega shinam stol'),
          type,
          typeLabel,
          floor: item.floor || 1,
          branch_id: item.branch_id || defaultBranchId,
        };
      });

      if (mappedData.length === 0) {
        const realisticMocks: BookingVenue[] = [
          {
            id: 'r1',
            name: 'Shahriyor VIP',
            capacity: 6,
            price_per_hour: 400000,
            image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80',
            is_available: true,
            type: 'vip',
            typeLabel: 'Xona',
            floor: 1,
            description: 'Barcha sharoitlarga ega oilaviy VIP xona, televizor va ajoyib akustika',
            branch_id: defaultBranchId,
          },
          {
            id: 'r2',
            name: 'Afsona Tantanalar Zali',
            capacity: 150,
            price_per_hour: 250000,
            image_url: 'https://images.unsplash.com/photo-1592861956120-e524fc739696?auto=format&fit=crop&q=80',
            is_available: true,
            type: 'hall',
            typeLabel: 'Marosimlar Zali',
            floor: 1,
            description: 'To\'y, ma\'rakalar va katta marosimlar uchun mo\'ljallangan muhtasham tantanalar zali',
            branch_id: defaultBranchId,
          },
          {
            id: 'r3',
            name: 'Bog\' Terassa Stoli',
            capacity: 8,
            price_per_hour: 320000,
            image_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80',
            is_available: true,
            type: 'table',
            typeLabel: 'Stol',
            floor: 2,
            description: 'Ochiq osmon ostidagi salqin shabadali terassa stoli',
            branch_id: defaultBranchId,
          },
          {
            id: 'r4',
            name: 'Samarqand VIP',
            capacity: 4,
            price_per_hour: 480000,
            image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80',
            is_available: true,
            type: 'vip',
            typeLabel: 'Xona',
            floor: 1,
            description: 'Haqiqiy sharqona uslubdagi premium darajadagi shinam xona',
            branch_id: defaultBranchId,
          },
        ];
        setVenues(realisticMocks);
      } else {
        setVenues(mappedData);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVenues = useMemo(() => {
    if (selectedCategory === 'all') return venues;
    return venues.filter((v) => v.type === selectedCategory);
  }, [venues, selectedCategory]);

  const handleCategoryChange = (category: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCategory(category);
  };

  const handleVenueSelect = (venue: BookingVenue) => {
    setSelectedVenue(venue);
    setGuestsCount(Math.min(4, venue.capacity)); // Default safe guests
    setStep(1);
    setShowModal(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCloseModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModal(false);
      setSelectedVenue(null);
      setStep(1);
    });
  };

  const handleNextStep = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep(2);
  };

  const handlePrevStep = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep(1);
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    const cleanPhone = formData.phone.replace(/\s+/g, '');
    if (!formData.customer_name.trim()) {
      Alert.alert('Xatolik', 'Iltimos, ism-familiyangizni kiriting');
      return;
    }
    if (cleanPhone.length < 9) {
      Alert.alert('Xatolik', 'Iltimos, telefon raqamingizni to\'liq kiriting');
      return;
    }

    try {
      submittingRef.current = true;
      setSubmitting(true);
      
      // Calculate end time (+3 hours standard reservation length)
      const [hour, minute] = selectedTime.split(':').map(Number);
      const endHour = (hour + 3) % 24;
      const formattedEndHour = endHour.toString().padStart(2, '0');
      const endTimeString = `${formattedEndHour}:${minute.toString().padStart(2, '0')}`;

      const reservationDateStr = daysData[selectedDayIndex].date.toISOString().split('T')[0];

      // Double check availability before final insert
      const { data: doubleCheck, error: checkErr } = await supabase
        .from('table_reservations')
        .select('id')
        .eq('table_id', selectedVenue?.id)
        .eq('reservation_date', reservationDateStr)
        .eq('start_time', `${selectedTime}:00`)
        .neq('status', 'cancelled')
        .limit(1);

      if (checkErr) throw checkErr;

      if (doubleCheck && doubleCheck.length > 0) {
        Alert.alert('Band qilingan', 'Afsuski, ushbu vaqtda bu joy hozirgina boshqa mijoz tomonidan band qilindi. Iltimos, boshqa soat yoki kunni tanlang.');
        checkVenueAvailability(selectedVenue!.id, reservationDateStr);
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from('table_reservations').insert([
        {
          table_id: selectedVenue?.id,
          branch_id: selectedVenue?.branch_id,
          customer_name: formData.customer_name.trim(),
          phone: cleanPhone,
          reservation_date: reservationDateStr,
          start_time: selectedTime,
          end_time: endTimeString,
          people_count: guestsCount,
          notes: formData.notes.trim(),
          status: 'pending',
        },
      ]);

      if (error) throw error;

      // Dynamic booking confirmation reference
      const randomRef = `#AFN-${Math.floor(1000 + Math.random() * 9000)}`;
      setBookingRef(randomRef);

      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setStep('success');
    } catch (error) {
      console.error('Submit reservation error:', error);
      Alert.alert('Xatolik', 'Bron qilishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const formatPrice = (price?: number) => {
    return "Hisobning 10%i";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_LIGHT} />

      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Afsona Restorani</Text>
          <Text style={styles.headerTitle}>Xona Bron Qilish</Text>
        </View>
      </View>

      {/* DYNAMIC CATEGORY FILTER CHIPS */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {[
            { id: 'all', label: 'Barchasi' },
            { id: 'vip', label: 'Xonalar' },
            { id: 'table', label: 'Stollar' },
            { id: 'hall', label: 'Marosimlar Zali' },
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => handleCategoryChange(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ROOMS / VENUES LIST */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={PRIMARY_RED} style={{ marginTop: 80 }} />
        ) : filteredVenues.length === 0 ? (
          <View style={styles.emptyState}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/7486/7486744.png' }}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyStateTitle}>Xona topilmadi</Text>
            <Text style={styles.emptyStateText}>
              Afsuski, ushbu toifada hozirda xonalar mavjud emas.
            </Text>
          </View>
        ) : (
          filteredVenues.map((venue) => (
            <View key={venue.id} style={styles.venueCard}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: venue.image_url }} style={styles.venueImage} />
                <View style={styles.imageOverlay} />

                {/* Availability Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: venue.is_available ? 'rgba(16, 185, 129, 0.95)' : 'rgba(156, 163, 175, 0.95)' }
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {venue.is_available ? "Bo'sh" : "Band"}
                  </Text>
                </View>

                {/* Category Type Label */}
                <View style={styles.typeLabelBadge}>
                  <Text style={styles.typeLabelBadgeText}>{venue.typeLabel}</Text>
                </View>
              </View>

              <View style={styles.cardInfo}>
                <View style={styles.cardHeaderLine}>
                  <Text style={styles.venueName}>{venue.name}</Text>
                  <View style={styles.capacityRow}>
                    <Users size={14} color={TEXT_GRAY} />
                    <Text style={styles.capacityText}>{venue.capacity} kishigacha</Text>
                  </View>
                </View>

                <Text style={styles.venueDesc} numberOfLines={2}>
                  {venue.description}
                </Text>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.priceLabel}>Narxi</Text>
                    <Text style={styles.priceValue}>{formatPrice(venue.price_per_hour)}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.bookBtn, !venue.is_available && styles.bookBtnDisabled]}
                    disabled={!venue.is_available}
                    onPress={() => handleVenueSelect(venue)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bookBtnText}>Bron qilish</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* MULTI-STEP BOOKING BOTTOM SHEET MODAL */}
      {showModal && (
        <View style={StyleSheet.absoluteFill}>
          {/* Backdrop overlay */}
          <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={step !== 'success' ? handleCloseModal : undefined}
            />
          </Animated.View>

          {/* Animated Sheet */}
          <Animated.View
            style={[
              styles.modalSheet,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Sheet indicator bar */}
            <View style={styles.sheetHandleWrap}>
              <View style={styles.sheetHandle} />
            </View>

            {/* Stepper bar indicator */}
            {step !== 'success' && (
              <View style={styles.modalHeader}>
                <View style={styles.stepperWrapper}>
                  {[1, 2].map((s) => (
                    <View
                      key={s}
                      style={[
                        styles.stepIndicatorLine,
                        s === step ? styles.stepIndicatorLineActive : null,
                      ]}
                    />
                  ))}
                </View>
                <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn}>
                  <X size={18} color={TEXT_DARK} />
                </TouchableOpacity>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {/* STEP 1: DATE & TIME SELECTION */}
              {step === 1 && (
                <View>
                  <Text style={styles.modalMainTitle}>Sana & Vaqt</Text>
                  <Text style={styles.modalSubtitle}>Xonani bron qilish uchun mos sana va vaqtni belgilang</Text>

                  <Text style={styles.sectionTitle}>Sanani tanlang</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.daysScrollContainer}
                  >
                    {daysData.map((day, idx) => {
                      const isSelected = idx === selectedDayIndex;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.dayCard, isSelected && styles.dayCardActive]}
                          onPress={() => setSelectedDayIndex(idx)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.dayOfWeek, isSelected && styles.dayOfWeekActive]}>
                            {day.dayLabel}
                          </Text>
                          <Text style={[styles.dayNum, isSelected && styles.dayNumActive]}>
                            {day.dayNum}
                          </Text>
                          <Text style={[styles.dayMonth, isSelected && styles.dayMonthActive]}>
                            {day.monthLabel}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <Text style={styles.sectionTitle}>Vaqtni tanlang</Text>
                  <View style={styles.timesGrid}>
                    {TIMES.map((t) => {
                      const isSelected = t === selectedTime;
                      const isBooked = bookedTimes.includes(t);
                      return (
                        <TouchableOpacity
                          key={t}
                          style={[
                            styles.timeChip,
                            isSelected && styles.timeChipActive,
                            isBooked && styles.timeChipBooked
                          ]}
                          disabled={isBooked}
                          onPress={() => setSelectedTime(t)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.timeChipText,
                              isSelected && styles.timeChipTextActive,
                              isBooked && styles.timeChipTextBooked
                            ]}
                          >
                            {t}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={styles.sectionTitle}>Mehmonlar soni</Text>
                  <View style={styles.guestsCounterWrapper}>
                    <View style={styles.guestsCounterLabelWrapper}>
                      <Users size={20} color={PRIMARY_RED} />
                      <Text style={styles.guestsCounterText}>Kishilar soni</Text>
                    </View>

                    <View style={styles.counterControlWrapper}>
                      <TouchableOpacity
                        style={styles.counterBtn}
                        onPress={() => setGuestsCount((g) => Math.max(1, g - 1))}
                        activeOpacity={0.7}
                      >
                        <Minus size={16} color={TEXT_DARK} />
                      </TouchableOpacity>
                      <Text style={styles.counterValueText}>{guestsCount}</Text>
                      <TouchableOpacity
                        style={styles.counterBtn}
                        onPress={() => setGuestsCount((g) => Math.min(selectedVenue?.capacity || 20, g + 1))}
                        activeOpacity={0.7}
                      >
                        <Plus size={16} color={TEXT_DARK} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.nextStepBtn}
                    onPress={handleNextStep}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.nextStepBtnText}>Keyingisi  →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 2: DETAILS CONFIRMATION & CONTACT FORM */}
              {step === 2 && selectedVenue && (
                <View>
                  <Text style={styles.modalMainTitle}>Tasdiqlash</Text>
                  <Text style={styles.modalSubtitle}>Kiritilgan ma'lumotlarni tekshiring va tasdiqlang</Text>

                  {/* Selected Room Preview Card */}
                  <View style={styles.previewRoomCard}>
                    <Image source={{ uri: selectedVenue.image_url }} style={styles.previewRoomImage} />
                    <View style={styles.previewRoomInfo}>
                      <Text style={styles.previewRoomName}>{selectedVenue.name}</Text>
                      <Text style={styles.previewRoomDesc}>
                        {selectedVenue.typeLabel} · {selectedVenue.capacity} kishigacha
                      </Text>
                    </View>
                    <View style={styles.successCheckCircle}>
                      <Check size={16} color="#FFF" />
                    </View>
                  </View>

                  {/* Contact Info Inputs */}
                  <Text style={styles.sectionTitle}>Mijoz ma'lumotlari</Text>
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Ism va familiyangiz"
                      placeholderTextColor="#9CA3AF"
                      value={formData.customer_name}
                      onChangeText={(t) => setFormData({ ...formData, customer_name: t })}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Telefon raqamingiz (+998 ...)"
                      keyboardType="phone-pad"
                      placeholderTextColor="#9CA3AF"
                      value={formData.phone}
                      onChangeText={(t) => setFormData({ ...formData, phone: t })}
                    />
                  </View>

                  {/* Specific wishes textarea */}
                  <Text style={styles.sectionTitle}>Maxsus istaklar (ixtiyoriy)</Text>
                  <TextInput
                    style={[styles.inputField, styles.textareaField]}
                    placeholder="Tort, gullar, maxsus menyu, ajoyib stol bezatish..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    value={formData.notes}
                    onChangeText={(t) => setFormData({ ...formData, notes: t })}
                  />

                  {/* Booking Receipt Summary Card */}
                  <View style={styles.receiptSummaryCard}>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Sana & Vaqt</Text>
                      <Text style={styles.receiptValue}>
                        {daysData[selectedDayIndex].dayNum}-{daysData[selectedDayIndex].monthLabel}, {selectedTime}
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Mehmonlar soni</Text>
                      <Text style={styles.receiptValue}>{guestsCount} kishi</Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>
                        {selectedVenue.type === 'vip' ? 'Xona narxi' : 'Stol narxi'}
                      </Text>
                      <Text style={styles.receiptValue}>{formatPrice(selectedVenue.price_per_hour)}</Text>
                    </View>
                    <View style={styles.receiptDivider} />
                    <View style={[styles.receiptRow, { marginBottom: 0 }]}>
                      <Text style={styles.receiptTotalLabel}>Jami</Text>
                      <Text style={styles.receiptTotalValue}>
                        {formatPrice(selectedVenue.price_per_hour)}
                      </Text>
                    </View>
                  </View>

                  {/* Submission Controls */}
                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={styles.backBtn}
                      onPress={handlePrevStep}
                      activeOpacity={0.8}
                    >
                      <ChevronLeft size={20} color={TEXT_DARK} />
                      <Text style={styles.backBtnText}>Ortga</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.finalSubmitBtn, submitting && { opacity: 0.7 }]}
                      onPress={handleSubmit}
                      disabled={submitting}
                      activeOpacity={0.9}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.finalSubmitBtnText}>Bron qilish</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* SUCCESS CONFIRMATION RECEIPT */}
              {step === 'success' && selectedVenue && (
                <View style={styles.successWrapper}>
                  {/* Big Animated success check circle */}
                  <View style={styles.bigSuccessCircle}>
                    <Check size={40} color="#FFF" strokeWidth={3} />
                  </View>

                  <Text style={styles.successTitle}>Broningiz tasdiqlandi!</Text>
                  <Text style={styles.successSubtitle}>
                    Sizning buyurtmangiz muvaffaqiyatli qabul qilindi. Tafsilotlar SMS orqali yuborildi.
                  </Text>

                  {/* Conf code badge */}
                  <View style={styles.refBadge}>
                    <Text style={styles.refBadgeText}>{bookingRef}</Text>
                  </View>

                  {/* Formal Receipt Card */}
                  <View style={styles.formalReceiptCard}>
                    <View style={styles.formalRow}>
                      <Text style={styles.formalLabel}>Xona</Text>
                      <Text style={styles.formalValue}>{selectedVenue.name}</Text>
                    </View>
                    <View style={styles.formalRow}>
                      <Text style={styles.formalLabel}>Sana & Vaqt</Text>
                      <Text style={styles.formalValue}>
                        {daysData[selectedDayIndex].dayNum}-{daysData[selectedDayIndex].monthLabel}, {selectedTime}
                      </Text>
                    </View>
                    <View style={styles.formalRow}>
                      <Text style={styles.formalLabel}>Mehmonlar</Text>
                      <Text style={styles.formalValue}>{guestsCount} kishi</Text>
                    </View>
                    <View style={styles.formalRow}>
                      <Text style={styles.formalLabel}>Buyurtmachi</Text>
                      <Text style={styles.formalValue}>{formData.customer_name}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.successCloseBtn}
                    onPress={handleCloseModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.successCloseBtnText}>Yopish</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default BookingScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_LIGHT,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 44 : 20,
    paddingBottom: 16,
    backgroundColor: BG_LIGHT,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY_RED,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: TEXT_DARK,
    letterSpacing: -0.5,
  },
  filtersWrapper: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  categoryScroll: {
    gap: 10,
    paddingRight: 24,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  categoryChipActive: {
    backgroundColor: PRIMARY_RED,
    borderColor: PRIMARY_RED,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_GRAY,
  },
  categoryTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    opacity: 0.35,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 6,
  },
  emptyStateText: {
    color: TEXT_GRAY,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  venueCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  imageContainer: {
    height: 190,
    width: '100%',
    position: 'relative',
  },
  venueImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  statusBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  typeLabelBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  typeLabelBadgeText: {
    color: TEXT_DARK,
    fontSize: 11,
    fontWeight: '700',
  },
  cardInfo: {
    padding: 20,
  },
  cardHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  venueName: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
    flex: 1,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  capacityText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_GRAY,
  },
  venueDesc: {
    fontSize: 14,
    color: TEXT_GRAY,
    lineHeight: 20,
    marginBottom: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  priceLabel: {
    fontSize: 11,
    color: TEXT_GRAY,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PRIMARY_RED,
  },
  bookBtn: {
    backgroundColor: PRIMARY_RED,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
  },
  bookBtnDisabled: {
    backgroundColor: ACCENT_GRAY,
    opacity: 0.5,
  },
  bookBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // MODAL STYLING
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    zIndex: 10,
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.9,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 24,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  stepperWrapper: {
    flexDirection: 'row',
    gap: 6,
  },
  stepIndicatorLine: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  stepIndicatorLineActive: {
    width: 24,
    backgroundColor: PRIMARY_RED,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingHorizontal: 24,
  },
  modalMainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: TEXT_GRAY,
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
    marginTop: 20,
    marginBottom: 12,
  },

  // STEP 1 UI
  daysScrollContainer: {
    gap: 10,
    paddingRight: 24,
    paddingBottom: 4,
  },
  dayCard: {
    width: 58,
    height: 84,
    borderRadius: 18,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCardActive: {
    backgroundColor: PRIMARY_RED,
    borderColor: PRIMARY_RED,
  },
  dayOfWeek: {
    fontSize: 11,
    color: TEXT_GRAY,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayOfWeekActive: {
    color: 'rgba(255,255,255,0.7)',
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 2,
  },
  dayNumActive: {
    color: '#FFF',
  },
  dayMonth: {
    fontSize: 10,
    color: TEXT_GRAY,
    fontWeight: '600',
  },
  dayMonthActive: {
    color: 'rgba(255,255,255,0.7)',
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    width: (width - 48 - 24) / 4,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChipActive: {
    backgroundColor: PRIMARY_RED,
    borderColor: PRIMARY_RED,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  timeChipTextActive: {
    color: '#FFF',
  },
  guestsCounterWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
  },
  guestsCounterLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guestsCounterText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  counterControlWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValueText: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
    width: 20,
    textAlign: 'center',
  },
  nextStepBtn: {
    backgroundColor: PRIMARY_RED,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  nextStepBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // STEP 2 UI
  previewRoomCard: {
    flexDirection: 'row',
    backgroundColor: BG_LIGHT,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 12,
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  previewRoomImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  previewRoomInfo: {
    flex: 1,
  },
  previewRoomName: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 2,
  },
  previewRoomDesc: {
    fontSize: 12,
    color: TEXT_GRAY,
  },
  successCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PRIMARY_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputField: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: TEXT_DARK,
    fontWeight: '600',
  },
  textareaField: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  receiptSummaryCard: {
    backgroundColor: BG_LIGHT,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 16,
    marginTop: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  receiptLabel: {
    fontSize: 13,
    color: TEXT_GRAY,
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 13,
    color: TEXT_DARK,
    fontWeight: '700',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: BORDER_COLOR,
    marginVertical: 10,
  },
  receiptTotalLabel: {
    fontSize: 14,
    color: TEXT_DARK,
    fontWeight: '800',
  },
  receiptTotalValue: {
    fontSize: 16,
    color: PRIMARY_RED,
    fontWeight: '900',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    gap: 4,
    height: 50,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  finalSubmitBtn: {
    flex: 2,
    backgroundColor: PRIMARY_RED,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  finalSubmitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // SUCCESS STEP UI
  successWrapper: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  bigSuccessCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: PRIMARY_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: PRIMARY_RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: TEXT_DARK,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    color: TEXT_GRAY,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  refBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  refBadgeText: {
    color: PRIMARY_RED,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 15,
    fontWeight: '800',
  },
  formalReceiptCard: {
    width: '100%',
    backgroundColor: BG_LIGHT,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 16,
    gap: 12,
    marginBottom: 28,
  },
  formalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formalLabel: {
    fontSize: 13,
    color: TEXT_GRAY,
    fontWeight: '500',
  },
  formalValue: {
    fontSize: 13,
    color: TEXT_DARK,
    fontWeight: '700',
  },
  successCloseBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  timeChipBooked: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.5,
  },
  timeChipTextBooked: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
});