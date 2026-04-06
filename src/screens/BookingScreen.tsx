import DateTimePicker from '@react-native-community/datetimepicker'
import { createClient } from '@supabase/supabase-js'
import {
    Calendar,
    ChevronRight,
    Clock,
    DollarSign,
    Minus,
    Plus,
    Users,
    X,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { MOCK_TABLES } from '../lib/mocks'

// ===== TYPES =====
interface Table {
  id: string;
  name: string;
  capacity: number;
  price_per_hour: number;
  image_url: string;
  is_available: boolean;
  description?: string;
}

interface BookingFormData {
  customer_name: string;
  phone: string;
  reservation_date: Date;
  start_time: Date;
  duration: number;
  people_count: number;
}

// ===== SUPABASE CLIENT =====
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ===== CONSTANTS =====
const PRIMARY_COLOR = '#FF0000';
const SECONDARY_COLOR = '#F5F5F5';
const DARK_TEXT = '#1F2937';
const LIGHT_TEXT = '#6B7280';
const BORDER_COLOR = '#E5E7EB';

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: LIGHT_TEXT,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: LIGHT_TEXT,
  },
  roomCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  roomImage: {
    width: '100%',
    height: 200,
    backgroundColor: SECONDARY_COLOR,
  },
  roomContent: {
    padding: 16,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roomNameContainer: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 4,
  },
  roomDescription: {
    fontSize: 13,
    color: LIGHT_TEXT,
    lineHeight: 18,
  },
  roomInfoRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  roomInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomInfoText: {
    fontSize: 13,
    color: DARK_TEXT,
    marginLeft: 6,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  modalSubtitle: {
    fontSize: 13,
    color: LIGHT_TEXT,
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SECONDARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK_TEXT,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: DARK_TEXT,
    backgroundColor: SECONDARY_COLOR,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SECONDARY_COLOR,
  },
  pickerButtonText: {
    fontSize: 16,
    color: DARK_TEXT,
    marginLeft: 10,
    fontWeight: '500',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: SECONDARY_COLOR,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  endTimeDisplay: {
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_COLOR,
  },
  endTimeLabel: {
    fontSize: 13,
    color: DARK_TEXT,
    fontWeight: '600',
  },
  endTimeValue: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: '700',
    marginTop: 4,
  },
  priceBox: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: LIGHT_TEXT,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK_TEXT,
  },
  priceDivider: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SECONDARY_COLOR,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_TEXT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multilineInput: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: DARK_TEXT,
    backgroundColor: SECONDARY_COLOR,
    textAlignVertical: 'top',
  },
});

// ===== MAIN COMPONENT =====
export default function BookingScreen() {
  // State: Rooms list
  const [rooms, setRooms] = useState<Table[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // State: Modal & Selected room
  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Table | null>(null);

  // State: Form data
  const [formData, setFormData] = useState<BookingFormData>({
    customer_name: '',
    phone: '',
    reservation_date: new Date(),
    start_time: new Date(),
    duration: 2,
    people_count: 1,
  });

  // State: Date/Time pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // State: Submission
  const [submitting, setSubmitting] = useState(false);

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  // ===== FUNCTIONS =====

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const { data, error } = await supabase
        .from('tables')
        .select('id, name, capacity, price_per_hour, image_url, is_available, description')
        .eq('is_available', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching rooms, using mock fallback:', error);
        setRooms(MOCK_TABLES as any);
        Alert.alert('Eslatma', 'Ma\'lumotlar bazasi bilan aloqa uzildi. Namuna xonalar ko\'rsatilmoqda.');
        return;
      }
      
      if (!data || data.length === 0) {
        console.warn('No active rooms found, using mock data');
        setRooms(MOCK_TABLES as any);
      } else {
        setRooms(data || []);
      }
    } catch (error) {
      console.error('Error in fetchRooms, using fallback:', error);
      setRooms(MOCK_TABLES as any);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleRoomSelect = (room: Table) => {
    setSelectedRoom(room);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      phone: '',
      reservation_date: new Date(),
      start_time: new Date(),
      duration: 2,
      people_count: 1,
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setFormData({ ...formData, reservation_date: selectedDate });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setFormData({ ...formData, start_time: selectedTime });
    }
  };

  const calculateEndTime = (startTime: Date, durationHours: number): Date => {
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + durationHours);
    return endTime;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDateForDatabase = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const validateForm = (): boolean => {
    if (!formData.customer_name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    if (formData.phone.length < 9) {
      Alert.alert('Error', 'Invalid phone number');
      return false;
    }
    if (formData.people_count < 1) {
      Alert.alert('Error', 'Number of guests must be at least 1');
      return false;
    }
    if (selectedRoom && formData.people_count > selectedRoom.capacity) {
      Alert.alert('Error', `Room capacity is ${selectedRoom.capacity} people`);
      return false;
    }
    if (formData.duration < 1 || formData.duration > 24) {
      Alert.alert('Error', 'Duration must be between 1 and 24 hours');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedRoom) return;

    try {
      setSubmitting(true);

      const endTime = calculateEndTime(formData.start_time, formData.duration);

      const { error } = await supabase.from('table_reservations').insert([
        {
          table_id: selectedRoom.id,
          customer_name: formData.customer_name.trim(),
          phone: formData.phone.trim(),
          reservation_date: formatDateForDatabase(formData.reservation_date),
          start_time: formatTime(formData.start_time),
          end_time: formatTime(endTime),
          people_count: formData.people_count,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      Alert.alert(
        'Success',
        'Your booking request has been submitted. We will contact you soon!',
        [{ text: 'OK', onPress: handleCloseModal }]
      );
    } catch (error) {
      console.error('Error submitting booking:', error);
      Alert.alert('Error', 'Failed to submit booking');
    } finally {
      setSubmitting(false);
    }
  };

  // ===== LOADING STATE =====
  if (loadingRooms) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  // ===== RENDER =====
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Book a Room</Text>
          <Text style={styles.headerSubtitle}>Select an available room to make a reservation</Text>
        </View>

        {/* Rooms List */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {rooms.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No available rooms</Text>
            </View>
          ) : (
            rooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                onPress={() => handleRoomSelect(room)}
                activeOpacity={0.7}
                style={styles.roomCard}
              >
                {/* Room Image */}
                {room.image_url && (
                  <Image source={{ uri: room.image_url }} style={styles.roomImage} />
                )}

                {/* Room Info */}
                <View style={styles.roomContent}>
                  <View style={styles.roomHeader}>
                    <View style={styles.roomNameContainer}>
                      <Text style={styles.roomName}>{room.name}</Text>
                      {room.description && (
                        <Text style={styles.roomDescription} numberOfLines={2}>
                          {room.description}
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={20} color={PRIMARY_COLOR} style={{ marginLeft: 12 }} />
                  </View>

                  {/* Capacity & Price */}
                  <View style={styles.roomInfoRow}>
                    <View style={styles.roomInfoItem}>
                      <Users size={16} color={PRIMARY_COLOR} />
                      <Text style={styles.roomInfoText}>{room.capacity} people</Text>
                    </View>

                    <View style={styles.roomInfoItem}>
                      <DollarSign size={16} color={PRIMARY_COLOR} />
                      <Text style={styles.roomInfoText}>
                        {room.price_per_hour.toLocaleString()} UZS/hr
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Booking Modal */}
        <Modal visible={showModal} transparent animationType="slide" onRequestClose={handleCloseModal}>
          <SafeAreaView style={styles.modalOverlay}>
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <View style={styles.modalContent}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>{selectedRoom?.name}</Text>
                    <Text style={styles.modalSubtitle}>Booking Details</Text>
                  </View>
                  <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                    <X size={20} color={DARK_TEXT} />
                  </TouchableOpacity>
                </View>

                {/* Form */}
                <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {/* Name */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                      placeholder="Enter your full name"
                      placeholderTextColor={LIGHT_TEXT}
                      value={formData.customer_name}
                      onChangeText={(text) =>
                        setFormData({ ...formData, customer_name: text })
                      }
                      style={styles.input}
                    />
                  </View>

                  {/* Phone */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                      placeholder="+998 (XX) XXX-XX-XX"
                      placeholderTextColor={LIGHT_TEXT}
                      keyboardType="phone-pad"
                      value={formData.phone}
                      onChangeText={(text) =>
                        setFormData({
                          ...formData,
                          phone: text.replace(/[^0-9+]/g, ''),
                        })
                      }
                      style={styles.input}
                    />
                  </View>

                  {/* Date Picker */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Reservation Date</Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      style={styles.pickerButton}
                    >
                      <Calendar size={18} color={PRIMARY_COLOR} />
                      <Text style={styles.pickerButtonText}>
                        {formatDate(formData.reservation_date)}
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={formData.reservation_date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                      />
                    )}
                  </View>

                  {/* Time Picker */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Start Time</Text>
                    <TouchableOpacity
                      onPress={() => setShowTimePicker(true)}
                      style={styles.pickerButton}
                    >
                      <Clock size={18} color={PRIMARY_COLOR} />
                      <Text style={styles.pickerButtonText}>
                        {formatTime(formData.start_time)}
                      </Text>
                    </TouchableOpacity>
                    {showTimePicker && (
                      <DateTimePicker
                        value={formData.start_time}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleTimeChange}
                      />
                    )}
                  </View>

                  {/* Duration */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Duration (Hours)</Text>
                    <View style={styles.counterRow}>
                      <TouchableOpacity
                        onPress={() => {
                          if (formData.duration > 1) {
                            setFormData({
                              ...formData,
                              duration: formData.duration - 1,
                            });
                          }
                        }}
                        style={styles.counterButton}
                      >
                        <Minus size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{formData.duration}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          if (formData.duration < 24) {
                            setFormData({
                              ...formData,
                              duration: formData.duration + 1,
                            });
                          }
                        }}
                        style={styles.counterButton}
                      >
                        <Plus size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* End Time Display */}
                  <View style={styles.endTimeDisplay}>
                    <Text style={styles.endTimeLabel}>End Time</Text>
                    <Text style={styles.endTimeValue}>
                      {formatTime(calculateEndTime(formData.start_time, formData.duration))}
                    </Text>
                  </View>

                  {/* Guest Count */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Number of Guests (Max: {selectedRoom?.capacity})
                    </Text>
                    <View style={styles.counterRow}>
                      <TouchableOpacity
                        onPress={() => {
                          if (formData.people_count > 1) {
                            setFormData({
                              ...formData,
                              people_count: formData.people_count - 1,
                            });
                          }
                        }}
                        style={styles.counterButton}
                      >
                        <Minus size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{formData.people_count}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          if (
                            selectedRoom &&
                            formData.people_count < selectedRoom.capacity
                          ) {
                            setFormData({
                              ...formData,
                              people_count: formData.people_count + 1,
                            });
                          }
                        }}
                        style={styles.counterButton}
                      >
                        <Plus size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Price Summary */}
                  {selectedRoom && (
                    <View style={styles.priceBox}>
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>
                          {selectedRoom.price_per_hour.toLocaleString()} UZS × {formData.duration}
                          {' hours'}
                        </Text>
                        <Text style={styles.priceValue}>
                          {(selectedRoom.price_per_hour * formData.duration).toLocaleString()}{' '}
                          UZS
                        </Text>
                      </View>
                      <View style={styles.priceDivider}>
                        <View style={styles.totalRow}>
                          <Text style={styles.totalLabel}>Total</Text>
                          <Text style={styles.totalValue}>
                            {(selectedRoom.price_per_hour * formData.duration).toLocaleString()}{' '}
                            UZS
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Action Buttons */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting}
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Confirm Booking</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleCloseModal} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}