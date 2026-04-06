import { Platform } from 'react-native'

// Google Maps API Key (required for Android)
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Map style for dark/light theme
export const getMapStyle = (isDark: boolean = false): any[] => {
  if (isDark) {
    return [
      {
        "elementType": "geometry",
        "stylers": [{ "color": "#242f3e" }]
      },
      {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#746855" }]
      },
      {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#242f3e" }]
      },
      {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
      },
      {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#263c3f" }]
      },
      {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#6b9a76" }]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#38414e" }]
      },
      {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#212a37" }]
      },
      {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9ca5b3" }]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{ "color": "#746855" }]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#1f2835" }]
      },
      {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#f3d19c" }]
      },
      {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [{ "color": "#2f3948" }]
      },
      {
        "featureType": "transit.station",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#17263c" }]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#515c6d" }]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#17263c" }]
      }
    ];
  }
  
  // Light theme - clean minimal style
  return [
    {
      "featureType": "poi.business",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "transit",
      "elementType": "labels.icon",
      "stylers": [{ "visibility": "off" }]
    }
  ];
};

// Default region (Tashkent)
export const DEFAULT_REGION = {
  latitude: 41.2995,
  longitude: 69.2401,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Map provider based on platform
export const MAP_PROVIDER = Platform.OS === 'ios' ? undefined : 'google';

// Calculate region to fit two coordinates with padding
export const calculateRegionForCoordinates = (
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
) => {
  const minLat = Math.min(coord1.latitude, coord2.latitude);
  const maxLat = Math.max(coord1.latitude, coord2.latitude);
  const minLng = Math.min(coord1.longitude, coord2.longitude);
  const maxLng = Math.max(coord1.longitude, coord2.longitude);

  const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
  const lngDelta = (maxLng - minLng) * 1.5;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(latDelta, 0.01),
    longitudeDelta: Math.max(lngDelta, 0.01),
  };
};

export { GOOGLE_MAPS_API_KEY }

