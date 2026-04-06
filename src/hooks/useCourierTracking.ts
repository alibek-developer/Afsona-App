import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useCourierTracking = (courierId: string | undefined, orderId: string | undefined, isTracking: boolean) => {
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

            const initialLocation = await Location.getCurrentPositionAsync({});
            if (mounted) setLocation(initialLocation);

            subscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000,
                    distanceInterval: 10,
                },
                async (newLocation) => {
                    if (mounted) {
                        setLocation(newLocation);
                        
                        if (courierId) {
                            try {
                                await supabase
                                    .from('courier_locations')
                                    .insert({
                                        courier_id: courierId,
                                        order_id: orderId || null,
                                        latitude: newLocation.coords.latitude,
                                        longitude: newLocation.coords.longitude,
                                    });
                            } catch (err) {
                                console.error('[useCourierTracking] Supabase error:', err);
                            }
                        }
                    }
                }
            );
        };

        if (isTracking && courierId) {
            startTracking();
        }

        return () => {
            mounted = false;
            subscription.current?.remove();
        };
    }, [isTracking, courierId, orderId]);

    return { location, errorMsg };
};
