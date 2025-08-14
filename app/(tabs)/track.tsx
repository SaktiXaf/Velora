import ActivityTypeSelector, { ActivityType } from '@/components/ActivityTypeSelector';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { activityService } from '@/lib/activityService';
import { LocationPoint, locationService, TrackingStats } from '@/lib/locationService';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

export default function TrackScreen() {
  const { colors } = useTheme();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isTracking, setIsTracking] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>('run');
  const [currentStats, setCurrentStats] = useState<TrackingStats>({
    distance: 0,
    duration: 0,
    pace: 0,
    calories: 0,
    avgSpeed: 0,
    maxSpeed: 0,
  });
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [trackingPath, setTrackingPath] = useState<LocationPoint[]>([]);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [isLocationReady, setIsLocationReady] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const statsUpdateInterval = useRef<number | null>(null);

  useEffect(() => {
    // Get initial location when component mounts - only once
    if (!isLocationReady) {
      initializeLocation();
    }
    
    return () => {
      // Cleanup on unmount
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (statsUpdateInterval.current) {
        clearInterval(statsUpdateInterval.current);
      }
    };
  }, []); // Remove isLocationReady from dependency to prevent multiple calls

  const initializeLocation = async () => {
    try {
      // Prevent multiple initialization
      if (isLocationReady) {
        console.log('📍 Location already initialized, skipping...');
        return;
      }

      console.log('🌍 Initializing location...');
      const hasPermission = await locationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Location permission is required to use this feature');
        return;
      }

      console.log('📍 Getting current location...');
      const location = await locationService.getCurrentLocation();
      if (location) {
        console.log('✅ Location found:', {
          lat: location.latitude.toFixed(6),
          lon: location.longitude.toFixed(6),
          accuracy: location.accuracy
        });
        setCurrentLocation(location);
        setIsLocationReady(true);
        
        // Give WebView time to load before updating location
        setTimeout(() => {
          updateMapLocation(location);
        }, 1000);
      } else {
        console.error('❌ Could not get location');
        Alert.alert('Error', 'Could not get your current location. Please check your GPS settings.');
      }
    } catch (error) {
      console.error('❌ Error initializing location:', error);
      Alert.alert('Error', 'Failed to get your location. Please ensure GPS is enabled.');
    }
  };

  const updateMapLocation = (location: LocationPoint) => {
    if (webViewRef.current) {
      const script = `
        try {
          if (window.map && window.userMarker) {
            console.log('Updating map location:', ${location.latitude}, ${location.longitude});
            window.map.setView([${location.latitude}, ${location.longitude}], window.map.getZoom() || 17);
            window.userMarker.setLatLng([${location.latitude}, ${location.longitude}]);
            ${trackingPath.length > 0 ? `
              if (window.trackLine) {
                window.trackLine.setLatLngs([${trackingPath.map(p => `[${p.latitude}, ${p.longitude}]`).join(',')}]);
              }
            ` : ''}
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'location_updated', success: true}));
          } else {
            console.log('Map or marker not ready yet');
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'location_updated', success: false, error: 'map_not_ready'}));
          }
        } catch (e) {
          console.error('Error updating map:', e);
          window.ReactNativeWebView.postMessage(JSON.stringify({type: 'location_updated', success: false, error: e.message}));
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const startLocationUpdates = async () => {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // Update every second
          distanceInterval: 1, // Update every meter
        },
        (location) => {
          console.log('📍 Location update:', {
            lat: location.coords.latitude.toFixed(6),
            lon: location.coords.longitude.toFixed(6),
            accuracy: location.coords.accuracy,
            speed: location.coords.speed
          });

          const locationPoint: LocationPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
            accuracy: location.coords.accuracy || undefined,
            speed: location.coords.speed || undefined,
            altitude: location.coords.altitude || undefined,
          };

          setCurrentLocation(locationPoint);
          locationService.addLocationPoint(locationPoint);
          const newPath = locationService.getTrackingData();
          setTrackingPath(newPath);
          updateMapLocation(locationPoint);
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      console.error('Error starting location updates:', error);
    }
  };

  const stopLocationUpdates = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  };

  const startStatsUpdates = () => {
    statsUpdateInterval.current = setInterval(() => {
      if (locationService.getIsTracking()) {
        const stats = locationService.getCurrentStats(activityType);
        setCurrentStats(stats);
      }
    }, 1000); // Update every second
  };

  const stopStatsUpdates = () => {
    if (statsUpdateInterval.current) {
      clearInterval(statsUpdateInterval.current);
      statsUpdateInterval.current = null;
    }
  };

  const handleStartTracking = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'You need to log in to start tracking activities. Would you like to go to the login page?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Login', 
            onPress: () => router.push('/login' as any)
          }
        ]
      );
      return;
    }

    try {
      const success = await locationService.startTracking();
      if (success) {
        setIsTracking(true);
        setTrackingPath([]);
        await startLocationUpdates();
        startStatsUpdates();
        Alert.alert('Tracking Started', 'Your activity is now being tracked!');
      } else {
        Alert.alert('Error', 'Failed to start tracking. Please check location permissions.');
      }
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Error', 'Failed to start tracking');
    }
  };

  const handleStopTracking = () => {
    // Check if user is authenticated before saving
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to save activities. Your current session will be lost.',
        [
          { text: 'Continue Without Saving', style: 'destructive', onPress: () => forceStopTracking() },
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Login to Save', 
            onPress: () => router.push('/login' as any)
          }
        ]
      );
      return;
    }

    Alert.alert(
      'Stop Tracking',
      'Are you sure you want to stop tracking this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => saveAndStopTracking()
        }
      ]
    );
  };

  const forceStopTracking = () => {
    const finalStats = locationService.stopTracking(activityType);
    setCurrentStats(finalStats);
    setIsTracking(false);
    stopLocationUpdates();
    stopStatsUpdates();
    
    Alert.alert(
      'Tracking Stopped',
      'Your activity has been stopped but not saved. Login to save your future activities.',
      [{ text: 'OK' }]
    );
  };

  const saveAndStopTracking = async () => {
    const finalStats = locationService.stopTracking(activityType);
    setCurrentStats(finalStats);
    setIsTracking(false);
    stopLocationUpdates();
    stopStatsUpdates();

    // Save activity to storage
    try {
      const savedActivity = await activityService.saveActivity({
        type: activityType,
        distance: finalStats.distance,
        duration: finalStats.duration,
        pace: finalStats.pace,
        calories: finalStats.calories,
        avgSpeed: finalStats.avgSpeed,
        maxSpeed: finalStats.maxSpeed,
        path: trackingPath.map(point => ({
          latitude: point.latitude,
          longitude: point.longitude,
          timestamp: point.timestamp,
        })),
      }, user?.id); // Pass user ID when saving

      console.log('Activity saved:', savedActivity);

      // Show final stats
      Alert.alert(
        `${activityType.charAt(0).toUpperCase() + activityType.slice(1)} Completed!`,
        `Distance: ${finalStats.distance.toFixed(2)} km\n` +
        `Duration: ${Math.floor(finalStats.duration / 60)}:${(finalStats.duration % 60).toString().padStart(2, '0')}\n` +
        `Pace: ${finalStats.pace.toFixed(2)} min/km\n` +
        `Calories: ${finalStats.calories} cal\n\n` +
        `Activity saved to your history!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving activity:', error);
      Alert.alert(
        `${activityType.charAt(0).toUpperCase() + activityType.slice(1)} Completed!`,
        `Distance: ${finalStats.distance.toFixed(2)} km\n` +
        `Duration: ${Math.floor(finalStats.duration / 60)}:${(finalStats.duration % 60).toString().padStart(2, '0')}\n` +
        `Pace: ${finalStats.pace.toFixed(2)} min/km\n` +
        `Calories: ${finalStats.calories} cal\n\n` +
        `Error saving activity. Please check your connection.`,
        [{ text: 'OK' }]
      );
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // HTML for the map
  const mapHTML = currentLocation ? `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100vw; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            // Initialize map with user's actual location
            console.log('🗺️ Initializing map at:', ${currentLocation.latitude}, ${currentLocation.longitude});
            window.map = L.map('map').setView([${currentLocation.latitude}, ${currentLocation.longitude}], 17);
            
            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(window.map);
            
            // Add user marker
            const userIcon = L.divIcon({
                className: 'user-marker',
                html: '<div style="background: #007AFF; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.3);"></div>',
                iconSize: [22, 22],
                iconAnchor: [11, 11]
            });
            
            window.userMarker = L.marker([${currentLocation.latitude}, ${currentLocation.longitude}], {
                icon: userIcon
            }).addTo(window.map);
            
            // Add tracking line
            window.trackLine = L.polyline([], {
                color: '#007AFF',
                weight: 4,
                opacity: 0.8
            }).addTo(window.map);
            
            // Notify React Native that map is ready
            setTimeout(() => {
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({type: 'map_ready'}));
                    console.log('📤 Map ready signal sent');
                }
            }, 500);
        </script>
    </body>
    </html>
  ` : `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                margin: 0; 
                padding: 0; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh;
                background: #f0f0f0;
                font-family: system-ui, -apple-system, sans-serif;
            }
            .loading {
                text-align: center;
                color: #666;
            }
            .spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #007AFF;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div class="loading">
            <div class="spinner"></div>
            <div>Getting your location...</div>
            <div style="font-size: 12px; margin-top: 8px;">Please ensure GPS is enabled</div>
        </div>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Track Activity</Text>
        <View style={styles.headerRight}>
          {/* Recording Status */}
          {isTracking && (
            <View style={styles.statusBadge}>
              <View style={[styles.recordingDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.statusText, { color: colors.error }]}>Recording</Text>
            </View>
          )}
        </View>
      </View>

      {/* Login Warning Banner */}
      {!authLoading && !isAuthenticated && (
        <View style={[styles.warningBanner, { backgroundColor: colors.warning }]}>
          <Ionicons name="warning" size={20} color={colors.background} />
          <Text style={[styles.warningText, { color: colors.background }]}>
            Login required to save activities
          </Text>
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: colors.background }]}
            onPress={() => router.push('/login' as any)}
          >
            <Text style={[styles.loginButtonText, { color: colors.warning }]}>Login</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Activity Type Selector (only show when not tracking) */}
      {!isTracking && (
        <ActivityTypeSelector 
          selectedType={activityType} 
          onTypeChange={setActivityType} 
        />
      )}

      {/* Map View */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHTML }}
          style={styles.map}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              console.log('📱 WebView message:', data);
              
              if (data.type === 'map_ready') {
                console.log('🗺️ Map is ready, updating location...');
                if (currentLocation) {
                  updateMapLocation(currentLocation);
                }
              } else if (data.type === 'location_updated') {
                if (!data.success) {
                  console.warn('⚠️ Map update failed:', data.error);
                }
              }
            } catch (error) {
              console.log('📱 WebView raw message:', event.nativeEvent.data);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />

        {/* Floating stats overlay */}
        <View style={[styles.statsOverlay, { backgroundColor: colors.surface }]}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {currentStats.distance.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatDuration(currentStats.duration)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {currentStats.pace > 0 ? currentStats.pace.toFixed(1) : '--'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>min/km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {currentStats.calories}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>cal</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Control Panel */}
      <View style={[styles.controlPanel, { backgroundColor: colors.surface }]}>
        <TouchableOpacity 
          style={[styles.trackButton, isTracking ? 
            { backgroundColor: colors.error } : 
            { backgroundColor: colors.primary }
          ]}
          onPress={isTracking ? handleStopTracking : handleStartTracking}
        >
          <Ionicons 
            name={isTracking ? "stop-circle" : "play-circle"} 
            size={48} 
            color={colors.background} 
          />
        </TouchableOpacity>
        
        <View style={styles.buttonLabels}>
          <Text style={[styles.buttonText, { color: colors.text }]}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
          {!isTracking && currentStats.distance > 0 && (
            <Text style={[styles.subButtonText, { color: colors.textSecondary }]}>
              Last: {currentStats.distance.toFixed(2)} km
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  loginButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
  },
  loginButtonText: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  title: {
    fontSize: Theme.typography.fontSize.xl,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Theme.spacing.xs,
  },
  statusText: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  statsOverlay: {
    position: 'absolute',
    top: Theme.spacing.md,
    left: Theme.spacing.md,
    right: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  statLabel: {
    fontSize: Theme.typography.fontSize.xs,
    fontFamily: Theme.typography.fontFamily.regular,
    marginTop: Theme.spacing.xs,
  },
  controlPanel: {
    padding: Theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  trackButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonLabels: {
    flex: 1,
  },
  buttonText: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  subButtonText: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    marginTop: Theme.spacing.xs,
  },
});
