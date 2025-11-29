import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import passengerBookingService from '../../services/passengerBookingService';
import routeService from '../../services/routeService';
import signalRService from '../../services/signalRService';
import type { BookingDTO } from '../../services/passengerBookingService';
import type { Route } from '../../services/routeService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

// Leaflet types
declare global {
  interface Window {
    L: any;
  }
}

const TrackBus = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ stations: any[]; bus: any | null; user: any | null }>({
    stations: [],
    bus: null,
    user: null,
  });

  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [route, setRoute] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busLocation, setBusLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (bookingId) {
      loadBookingData();
    }

    // Load Leaflet CSS and JS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      if (booking) {
        initializeMap();
      }
    };
    document.body.appendChild(script);

    return () => {
      if (booking?.tripId) {
        signalRService.disconnectTracking(booking.tripId);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [bookingId, booking?.tripId]);

  useEffect(() => {
    if (booking && route.length > 0 && window.L && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [booking, route]);

  const loadBookingData = async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      setError(null);

      // Get user ID from auth
      const authService = (await import('../../services/authService')).default;
      const user = new authService().getUserInfo();
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      // Get all bookings and find the one we need
      const response = await passengerBookingService.getByPassengerId(user.id);
      if (response.isSuccess && response.result) {
        const bookingIdNum = parseInt(bookingId);
        const foundBooking = response.result.find((b) => b.bookingId === bookingIdNum);
        
        if (!foundBooking) {
          setError('Booking not found');
          return;
        }

        setBooking(foundBooking);

        // Load route data
        if (foundBooking.tripId) {
          const routeResponse = await routeService.getRouteForTrip(foundBooking.tripId);
          if (routeResponse.isSuccess && routeResponse.result) {
            const sortedRoute = routeResponse.result.sort((a, b) => a.order - b.order);
            setRoute(sortedRoute);
          }
        }
      } else {
        setError(response.message || 'Failed to load booking');
      }
    } catch (error) {
      setError('Failed to load booking data');
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!window.L || !mapRef.current || !booking) return;

    const L = window.L;

    // Initialize map centered on user's station
    const userLat = booking.stationFrom?.latitude || 30.0444;
    const userLng = booking.stationFrom?.longitude || 31.2357;

    const map = L.map(mapRef.current).setView([userLat, userLng], 13);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add station markers - we'll need to get station coordinates
    // For now, we'll create markers with estimated positions
    // In production, you'd fetch station details with coordinates
    route.forEach((routeItem, index) => {
      // Estimate position along route (this is a placeholder)
      // In production, fetch actual station coordinates
      const stationLat = userLat + (index * 0.01);
      const stationLng = userLng + (index * 0.01);
      
      const marker = L.marker([stationLat, stationLng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        }),
      })
        .bindPopup(routeItem.stationName)
        .addTo(map);

      markersRef.current.stations.push(marker);
    });

    // Add user location marker
    const userMarker = L.marker([userLat, userLng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
    })
      .bindPopup('Your Location')
      .addTo(map);

    markersRef.current.user = userMarker;

    // Connect to tracking
    if (booking.tripId) {
      connectTracking(booking.tripId, userLat, userLng);
    }
  };

  const connectTracking = async (tripId: number, userLat: number, userLng: number) => {
    try {
      await signalRService.connectTracking(tripId, (busId, lat, lng) => {
        setBusLocation({ lat, lng });
        updateBusMarker(lat, lng);
        calculateDistance(userLat, userLng, lat, lng);
      });
      setConnected(true);
    } catch (error) {
      setError('Failed to connect to bus tracking. Please try again.');
    }
  };

  const updateBusMarker = (lat: number, lng: number) => {
    if (!window.L || !mapInstanceRef.current) return;

    const L = window.L;

    if (markersRef.current.bus) {
      markersRef.current.bus.setLatLng([lat, lng]);
    } else {
      // Create bus marker
      const busIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        iconSize: [30, 41],
        iconAnchor: [15, 41],
      });

      markersRef.current.bus = L.marker([lat, lng], { icon: busIcon })
        .bindPopup('Bus Location')
        .addTo(mapInstanceRef.current);
    }

    // Center map on bus
    mapInstanceRef.current.setView([lat, lng], 15);
  };

  const calculateDistance = async (userLat: number, userLng: number, busLat: number, busLng: number) => {
    try {
      const response = await routeService.calculateDistance(userLng, userLat, busLng, busLat);
      setDistance(response.distance);
      setDuration(response.duration);
    } catch (error) {
      console.error('Failed to calculate distance:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !booking) {
    return (
      <div className="space-y-6">
        <ErrorMessage message={error} />
        <button
          onClick={() => navigate('/passenger/bookings')}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Live Bus Tracking</h1>
            <p className="mt-2 text-gray-600">
              {booking?.stationFrom?.name} → {booking?.stationTo?.name}
            </p>
          </div>
          <button
            onClick={() => navigate('/passenger/bookings')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Connection Status</p>
          <p className={`mt-2 text-lg font-semibold ${connected ? 'text-green-600' : 'text-red-600'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </p>
        </div>
        {distance !== null && (
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Distance</p>
            <p className="mt-2 text-lg font-semibold text-blue-600">{distance.toFixed(2)} km</p>
          </div>
        )}
        {duration !== null && (
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-600">ETA</p>
            <p className="mt-2 text-lg font-semibold text-blue-600">{Math.round(duration)} min</p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div ref={mapRef} style={{ height: '600px', width: '100%' }} className="rounded-md" />
      </div>

      {!connected && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Connecting to bus tracking... Please wait. If the bus hasn't started yet, tracking will begin when the trip starts.
          </p>
        </div>
      )}
    </div>
  );
};

export default TrackBus;

