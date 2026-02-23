import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useCourierTracking = (orderId: string | undefined, isTracking: boolean) => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const subscription = useRef<Location.LocationSubscription | null>(null);

    useEffect(() => {
        let mounted = true;

        const startTracking = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Location permission denied');
                return;
            }

            // Get initial location
            const initialLocation = await Location.getCurrentPositionAsync({});
            if (mounted) setLocation(initialLocation);

            // Watch position
            subscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 5000,
                    distanceInterval: 10,
                },
                async (newLocation) => {
                    if (mounted) {
                        setLocation(newLocation);
                        
                        // Sync with Supabase
                        if (orderId) {
                            await supabase
                                .from('orders')
                                .update({
                                    latitude: newLocation.coords.latitude,
                                    longitude: newLocation.coords.longitude,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', orderId);
                        }
                    }
                }
            );
        };

        if (isTracking && orderId) {
            startTracking();
        }

        return () => {
            mounted = false;
            subscription.current?.remove();
        };
    }, [isTracking, orderId]);

    return { location, errorMsg };
};
