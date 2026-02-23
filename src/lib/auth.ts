import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'

export const getOrCreateDeviceId = async () => {
  try {
    let deviceId = await AsyncStorage.getItem('user_device_id');
    if (!deviceId) {
      deviceId = Crypto.randomUUID();
      await AsyncStorage.setItem('user_device_id', deviceId);
    }
    return deviceId;
  } catch (e) {
    console.error("Device ID olishda xato:", e);
    return 'unknown_device';
  }
};