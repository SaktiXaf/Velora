import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  altitude?: number;
}

export interface TrackingStats {
  distance: number; // in kilometers
  duration: number; // in seconds
  pace: number; // minutes per kilometer
  calories: number; // estimated calories burned
  avgSpeed: number; // km/h
  maxSpeed: number; // km/h
}

class LocationService {
  private isTracking = false;
  private trackingData: LocationPoint[] = [];
  private startTime: number = 0;
  private lastLocation: LocationPoint | null = null;
  private totalDistance = 0;

  async requestPermissions(): Promise<boolean> {
    try {
      console.log('🔐 Requesting location permissions...');
      
      // Check if location services are enabled
      const isLocationServicesEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationServicesEnabled) {
        console.error('❌ Location services are disabled');
        throw new Error('Location services are disabled. Please enable GPS in your device settings.');
      }

      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      console.log('📱 Foreground permission status:', foregroundStatus);
      
      if (foregroundStatus !== 'granted') {
        throw new Error('Permission to access location was denied');
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      console.log('📱 Background permission status:', backgroundStatus);
      
      if (backgroundStatus !== 'granted') {
        console.warn('⚠️ Background location permission not granted');
      }

      console.log('✅ Location permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationPoint | null> {
    try {
      console.log('🌍 Requesting current location with high accuracy...');
      
      // Try to get a high accuracy location with timeout
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000, // 5 second timeout
      });

      console.log('✅ High accuracy location found:', {
        lat: location.coords.latitude.toFixed(6),
        lon: location.coords.longitude.toFixed(6),
        accuracy: location.coords.accuracy
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy || undefined,
        speed: location.coords.speed || undefined,
        altitude: location.coords.altitude || undefined,
      };
    } catch (error) {
      console.warn('⚠️ High accuracy location failed, trying fallback:', error);
      
      // Fallback to lower accuracy if high accuracy fails
      try {
        const fallbackLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
        });

        console.log('✅ Fallback location found:', {
          lat: fallbackLocation.coords.latitude.toFixed(6),
          lon: fallbackLocation.coords.longitude.toFixed(6),
          accuracy: fallbackLocation.coords.accuracy
        });

        return {
          latitude: fallbackLocation.coords.latitude,
          longitude: fallbackLocation.coords.longitude,
          timestamp: fallbackLocation.timestamp,
          accuracy: fallbackLocation.coords.accuracy || undefined,
          speed: fallbackLocation.coords.speed || undefined,
          altitude: fallbackLocation.coords.altitude || undefined,
        };
      } catch (fallbackError) {
        console.error('❌ All location methods failed:', fallbackError);
        return null;
      }
    }
  }

  async startTracking(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      this.isTracking = true;
      this.trackingData = [];
      this.totalDistance = 0;
      this.startTime = Date.now();
      this.lastLocation = null;

      // Get initial location
      const initialLocation = await this.getCurrentLocation();
      if (initialLocation) {
        this.trackingData.push(initialLocation);
        this.lastLocation = initialLocation;
      }

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  stopTracking(activityType: string = 'run'): TrackingStats {
    this.isTracking = false;
    
    const endTime = Date.now();
    const duration = Math.floor((endTime - this.startTime) / 1000); // seconds
    const distance = this.totalDistance; // km
    const pace = distance > 0 ? duration / 60 / distance : 0; // min/km
    const avgSpeed = distance > 0 ? distance / (duration / 3600) : 0; // km/h
    
    // Estimate calories based on activity type (calories per km for 70kg person)
    const calorieRates = {
      run: 60,    // Running: ~60 cal/km
      bike: 30,   // Cycling: ~30 cal/km
      walk: 40,   // Walking: ~40 cal/km
    };
    const calorieRate = calorieRates[activityType as keyof typeof calorieRates] || 50;
    const calories = Math.round(distance * calorieRate);
    
    // Calculate max speed from tracking data
    const speeds = this.trackingData
      .map(point => point.speed || 0)
      .filter(speed => speed > 0);
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) * 3.6 : 0; // convert m/s to km/h

    return {
      distance,
      duration,
      pace,
      calories,
      avgSpeed,
      maxSpeed,
    };
  }

  addLocationPoint(location: LocationPoint): void {
    if (!this.isTracking) return;

    this.trackingData.push(location);

    // Calculate distance from last point
    if (this.lastLocation) {
      const distance = this.calculateDistance(
        this.lastLocation.latitude,
        this.lastLocation.longitude,
        location.latitude,
        location.longitude
      );
      this.totalDistance += distance;
    }

    this.lastLocation = location;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula to calculate distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  getCurrentStats(activityType: string = 'run'): TrackingStats {
    if (!this.isTracking) {
      return {
        distance: 0,
        duration: 0,
        pace: 0,
        calories: 0,
        avgSpeed: 0,
        maxSpeed: 0,
      };
    }

    const currentTime = Date.now();
    const duration = Math.floor((currentTime - this.startTime) / 1000);
    const distance = this.totalDistance;
    const pace = distance > 0 ? duration / 60 / distance : 0;
    const avgSpeed = distance > 0 ? distance / (duration / 3600) : 0;
    
    // Estimate calories based on activity type
    const calorieRates = {
      run: 60,    // Running: ~60 cal/km
      bike: 30,   // Cycling: ~30 cal/km  
      walk: 40,   // Walking: ~40 cal/km
    };
    const calorieRate = calorieRates[activityType as keyof typeof calorieRates] || 50;
    const calories = Math.round(distance * calorieRate);

    const speeds = this.trackingData
      .map(point => point.speed || 0)
      .filter(speed => speed > 0);
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) * 3.6 : 0;

    return {
      distance,
      duration,
      pace,
      calories,
      avgSpeed,
      maxSpeed,
    };
  }

  getTrackingData(): LocationPoint[] {
    return [...this.trackingData];
  }

  getIsTracking(): boolean {
    return this.isTracking;
  }

  getTotalDistance(): number {
    return this.totalDistance;
  }
}

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    // Handle the location updates here
    console.log('Received new locations', locations);
  }
});

export const locationService = new LocationService();
export default LocationService;
