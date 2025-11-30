import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import scheduleService, { Schedule } from '../../services/scheduleService';
import driverService from '../../services/driverService';
import trackingService from '../../services/trackingService';
import signalRService from '../../services/signalRService';
import routeService, { Route } from '../../services/routeService';
import stationService from '../../services/stationService';
import { tokenManager } from '../../utils/tokenManager';
import { formatEgyptTime } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';

// Declare Leaflet types
declare global {
  interface Window {
    L: any;
  }
}

type TripStatus = 'not_started' | 'in_progress' | 'cancelled' | 'completed';

const ActiveTrip = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = tokenManager.getUserInfo();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [routeStations, setRouteStations] = useState<Route[]>([]);
  const [tripStatus, setTripStatus] = useState<TripStatus>('not_started');
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nextStation, setNextStation] = useState<{ name: string; distance: number; eta: number; order: number } | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const busMarkerRef = useRef<any>(null);
  const stationMarkersRef = useRef<any[]>([]);
  const routePolylineRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const updateCountRef = useRef(0);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadTripData();
    
    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      if (mapRef.current) {
        initializeMap();
      }
    };
    document.body.appendChild(script);

    return () => {
      stopTracking();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, []);

  // Redraw route when stations are loaded
  useEffect(() => {
    if (window.L && mapInstanceRef.current && routeStations.length > 0) {
      drawRouteOnMap();
    }
  }, [routeStations]);

  const loadTripData = async () => {
    if (!user?.id) {
      setError('User not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(undefined);

      const scheduleId = searchParams.get('scheduleId');
      let scheduleData: Schedule | null = null;

      if (scheduleId) {
        // Load specific schedule
        const response = await scheduleService.getByDriverId(user.id);
        if (response.isSuccess && response.result) {
          scheduleData = response.result.find(s => s.schId === parseInt(scheduleId)) || null;
        }
      } else {
        // Load current schedule
        const response = await scheduleService.getCurrentByDriverId(user.id);
        if (response.isSuccess && response.result) {
          scheduleData = response.result;
        }
      }

      if (!scheduleData) {
        setError('No schedule found');
        setLoading(false);
        return;
      }

      setSchedule(scheduleData);

      // Load route stations
      const routeResponse = await routeService.getRouteForTrip(scheduleData.tripId);
      if (routeResponse.isSuccess && routeResponse.result) {
        const sorted = routeResponse.result.sort((a, b) => a.order - b.order);
        setRouteStations(sorted);
        
        // Load station coordinates
        const stationsWithCoords = await Promise.all(
          sorted.map(async (route) => {
            try {
              const stationResponse = await stationService.getByName(route.stationName);
              if (stationResponse.isSuccess && stationResponse.result) {
                return {
                  ...route,
                  latitude: stationResponse.result.latitude,
                  longitude: stationResponse.result.longitude,
                };
              }
            } catch (err) {
              console.error(`Failed to load station ${route.stationName}:`, err);
            }
            return route;
          })
        );
        setRouteStations(stationsWithCoords as any);
      }

      // Check if trip is already active
      const activeTripId = localStorage.getItem('activeTripId');
      if (activeTripId && activeTripId === scheduleData.tripId.toString()) {
        setTripStatus('in_progress');
        const startTime = localStorage.getItem('tripStartTime');
        if (startTime) {
          setTripStartTime(new Date(startTime));
        }
        startTracking();
      }

    } catch (err: any) {
      console.error('Failed to load trip data:', err);
      setError(err.message || 'Failed to load trip data');
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!window.L || !mapRef.current) return;

    const L = window.L;

    // Default center (Cairo)
    const centerLat = routeStations.length > 0 && (routeStations[0] as any).latitude 
      ? (routeStations[0] as any).latitude 
      : 30.0444;
    const centerLng = routeStations.length > 0 && (routeStations[0] as any).longitude
      ? (routeStations[0] as any).longitude
      : 31.2357;

    const map = L.map(mapRef.current).setView([centerLat, centerLng], 13);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Draw stations and route if available
    if (routeStations.length > 0) {
      drawRouteOnMap();
    }
  };

  const drawRouteOnMap = () => {
    if (!window.L || !mapInstanceRef.current || routeStations.length === 0) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear existing markers
    stationMarkersRef.current.forEach(marker => marker.remove());
    stationMarkersRef.current = [];
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
    }

    // Create station markers
    const coordinates: [number, number][] = [];
    
    routeStations.forEach((station, index) => {
      const lat = (station as any).latitude || 30.0444 + (index * 0.01);
      const lng = (station as any).longitude || 31.2357 + (index * 0.01);
      
      coordinates.push([lat, lng]);

      // Create custom station icon
      const stationIcon = L.divIcon({
        className: 'station-marker',
        html: `<div style="background: #2563eb; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${station.order}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([lat, lng], { icon: stationIcon }).addTo(map);
      marker.bindPopup(`
        <strong>${station.stationName}</strong><br>
        Order: ${station.order}
      `);
      stationMarkersRef.current.push(marker);
    });

    // Draw route polyline
    if (coordinates.length > 1) {
      const polyline = L.polyline(coordinates, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.7,
      }).addTo(map);
      routePolylineRef.current = polyline;
      
      // Fit map to show all stations
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  };

  const startTracking = async () => {
    if (!schedule || !user?.id) return;

    try {
      // Connect to SignalR
      await signalRService.connectTracking(schedule.tripId, () => {
        // This callback is for receiving location updates (not needed for driver)
      });

      // Start GPS tracking
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => handlePositionUpdate(position),
          (error) => handleGPSError(error),
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );

        // Also send updates every 5 seconds (fallback)
        locationIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (position) => handlePositionUpdate(position),
            (error) => handleGPSError(error),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        }, 5000);
      } else {
        setError('GPS not supported by your browser');
      }
    } catch (err) {
      console.error('Failed to start tracking:', err);
      setError('Failed to start GPS tracking');
    }
  };

  const handlePositionUpdate = async (position: GeolocationPosition) => {
    if (!schedule || !user?.id) return;

    const { latitude, longitude } = position.coords;
    setCurrentLocation({ lat: latitude, lng: longitude });

    // Update map marker
    updateBusMarker(latitude, longitude);

    // Send to SignalR
    await signalRService.sendLocationUpdate(user.id, latitude, longitude);

    updateCountRef.current++;

    // Every 12 updates (≈60 seconds), check next station
    if (updateCountRef.current >= 12) {
      await trackingService.checkNextStation(schedule.tripId, longitude, latitude);
      updateCountRef.current = 0;
      
      // Calculate next station info
      calculateNextStation(latitude, longitude);
    }
  };

  const updateBusMarker = (lat: number, lng: number) => {
    if (!window.L || !mapInstanceRef.current) return;

    const L = window.L;

    if (!busMarkerRef.current) {
      // Create bus icon
      const busIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      });

      busMarkerRef.current = L.marker([lat, lng], { icon: busIcon }).addTo(mapInstanceRef.current);
      busMarkerRef.current.bindPopup('<strong>Current Bus Location</strong>');
    } else {
      busMarkerRef.current.setLatLng([lat, lng]);
    }

    // Center map on bus
    mapInstanceRef.current.panTo([lat, lng]);
  };

  const calculateNextStation = async (busLat: number, busLng: number) => {
    if (routeStations.length === 0) return;

    // Find nearest station ahead
    let nearestStation: Route | null = null;
    let minDistance = Infinity;

    for (const station of routeStations) {
      const stationLat = (station as any).latitude;
      const stationLng = (station as any).longitude;
      
      if (!stationLat || !stationLng) continue;

      const distance = calculateDistance(busLat, busLng, stationLat, stationLng);
      
      // Only consider stations ahead (higher order)
      if (distance < minDistance && station.order > (nextStation?.order || 0)) {
        minDistance = distance;
        nearestStation = station;
      }
    }

    if (nearestStation) {
      const stationLat = (nearestStation as any).latitude;
      const stationLng = (nearestStation as any).longitude;
      
      if (stationLat && stationLng) {
        // Estimate ETA (assuming average speed of 40 km/h)
        const eta = Math.round((minDistance / 40) * 60); // minutes
        
        setNextStation({
          name: nearestStation.stationName,
          distance: Math.round(minDistance * 10) / 10, // Round to 1 decimal
          eta,
          order: nearestStation.order,
        });
      }
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleGPSError = (error: GeolocationPositionError) => {
    console.error('GPS Error:', error);
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setError('Please enable GPS permissions in your browser settings');
        break;
      case error.POSITION_UNAVAILABLE:
        setError('GPS position unavailable');
        break;
      case error.TIMEOUT:
        console.warn('GPS timeout, retrying...');
        break;
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    updateCountRef.current = 0;
  };

  const handleStartTrip = async () => {
    if (!schedule || !user?.id) return;

    try {
      setError(undefined);
      const response = await driverService.startTrip(user.id);
      
      if (response.isSuccess) {
        setTripStatus('in_progress');
        setTripStartTime(new Date());
        localStorage.setItem('activeTripId', schedule.tripId.toString());
        localStorage.setItem('tripStartTime', new Date().toISOString());
        
        // Start tracking
        await startTracking();
      } else {
        setError(response.message || 'Failed to start trip');
      }
    } catch (err: any) {
      console.error('Failed to start trip:', err);
      setError(err.message || 'Failed to start trip');
    }
  };

  const handleCancelTrip = async () => {
    if (!schedule || !user?.id) return;

    if (!confirm('Are you sure you want to cancel this trip?')) {
      return;
    }

    try {
      setError(undefined);
      const response = await driverService.cancelTrip(user.id);
      
      if (response.isSuccess) {
        setTripStatus('cancelled');
        stopTracking();
        await signalRService.disconnectTracking();
        localStorage.removeItem('activeTripId');
        localStorage.removeItem('tripStartTime');
        
        setTimeout(() => {
          navigate('/driver/dashboard');
        }, 2000);
      } else {
        setError(response.message || 'Failed to cancel trip');
      }
    } catch (err: any) {
      console.error('Failed to cancel trip:', err);
      setError(err.message || 'Failed to cancel trip');
    }
  };

  const handleEndTrip = async () => {
    if (!schedule || !user?.id || !tripStartTime) return;

    // Check if 2 hours have passed
    const now = new Date();
    const hoursElapsed = (now.getTime() - tripStartTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursElapsed < 2) {
      setError('Trip cannot be ended before 2 hours of start time');
      return;
    }

    if (!confirm('Are you sure you want to end this trip?')) {
      return;
    }

    try {
      setError(undefined);
      const response = await driverService.endTrip(user.id);
      
      if (response.isSuccess) {
        setTripStatus('completed');
        stopTracking();
        await signalRService.disconnectTracking();
        localStorage.removeItem('activeTripId');
        localStorage.removeItem('tripStartTime');
        
        setTimeout(() => {
          navigate('/driver/dashboard');
        }, 2000);
      } else {
        setError(response.message || 'Failed to end trip');
      }
    } catch (err: any) {
      console.error('Failed to end trip:', err);
      setError(err.message || 'Failed to end trip');
    }
  };

  const getTripDuration = (): string => {
    if (!tripStartTime) return '0:00';
    
    const now = new Date();
    const diffMs = now.getTime() - tripStartTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const canEndTrip = (): boolean => {
    if (!tripStartTime) return false;
    const now = new Date();
    const hoursElapsed = (now.getTime() - tripStartTime.getTime()) / (1000 * 60 * 60);
    return hoursElapsed >= 2;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !schedule) {
    return <ErrorMessage message={error} />;
  }

  if (!schedule) {
    return <ErrorMessage message="No schedule found" />;
  }

  return (
    <div className="space-y-6">
      {/* Trip Information Panel */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {schedule.from} → {schedule.to}
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-600">Departure Time</p>
                <p className="font-medium text-gray-800">
                  {formatEgyptTime(schedule.departureDateTime, true)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bus</p>
                <p className="font-medium text-gray-800">
                  {schedule.busCode} ({schedule.busType})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trip Duration</p>
                <p className="font-medium text-gray-800">
                  {tripStatus === 'in_progress' ? getTripDuration() : '--:--'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`font-medium ${
                  tripStatus === 'in_progress' ? 'text-blue-600' :
                  tripStatus === 'completed' ? 'text-green-600' :
                  tripStatus === 'cancelled' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {tripStatus === 'in_progress' ? '🚌 On Trip' :
                   tripStatus === 'completed' ? '✅ Completed' :
                   tripStatus === 'cancelled' ? '❌ Cancelled' :
                   '⏸️ Not Started'}
                </p>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-col gap-2 lg:ml-4">
            {tripStatus === 'not_started' && (
              <Button
                onClick={handleStartTrip}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3"
              >
                Start Trip
              </Button>
            )}
            {tripStatus === 'in_progress' && (
              <>
                <Button
                  onClick={handleCancelTrip}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3"
                >
                  Cancel Trip
                </Button>
                <Button
                  onClick={handleEndTrip}
                  disabled={!canEndTrip()}
                  className={`font-semibold px-6 py-3 ${
                    canEndTrip()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {canEndTrip() ? 'End Trip' : `End Trip (${(2 - (tripStartTime ? (new Date().getTime() - tripStartTime.getTime()) / (1000 * 60 * 60) : 0)).toFixed(1)}h remaining)`}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Next Station Info */}
        {tripStatus === 'in_progress' && nextStation && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Next Station</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-blue-600">Station</p>
                <p className="font-medium text-blue-800">{nextStation.name}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Distance</p>
                <p className="font-medium text-blue-800">{nextStation.distance} km</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">ETA</p>
                <p className="font-medium text-blue-800">{nextStation.eta} minutes</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Map View */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="h-[600px] w-full" ref={mapRef}></div>
      </div>

      {/* Current Location Display */}
      {currentLocation && tripStatus === 'in_progress' && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Current Location</p>
          <p className="font-mono text-sm text-gray-800">
            {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

export default ActiveTrip;

