import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

type MapPickerProps = {
    latitude: number;
    longitude: number;
    onLocationChange: (lat: number, lng: number) => void;
    height?: string;
};

const MapPicker = ({ latitude, longitude, onLocationChange, height = '400px' }: MapPickerProps) => {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Create map
        const map = L.map(mapContainerRef.current).setView([latitude || 30.0444, longitude || 31.2357], 13);

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);

        // Add marker
        const marker = L.marker([latitude || 30.0444, longitude || 31.2357], {
            draggable: true,
        }).addTo(map);

        // Handle marker drag
        marker.on('dragend', () => {
            const position = marker.getLatLng();
            onLocationChange(position.lat, position.lng);
        });

        // Handle map click
        map.on('click', (e: L.LeafletMouseEvent) => {
            marker.setLatLng(e.latlng);
            onLocationChange(e.latlng.lat, e.latlng.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;
        setIsMapReady(true);

        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    // Update marker position when props change
    useEffect(() => {
        if (isMapReady && markerRef.current && mapRef.current) {
            const newLatLng = L.latLng(latitude, longitude);
            markerRef.current.setLatLng(newLatLng);
            mapRef.current.setView(newLatLng, mapRef.current.getZoom());
        }
    }, [latitude, longitude, isMapReady]);

    return (
        <div className="space-y-2">
            <div
                ref={mapContainerRef}
                style={{ height, width: '100%' }}
                className="rounded-lg border border-gray-300 overflow-hidden"
            />
            <p className="text-xs text-gray-500">
                Click on the map or drag the marker to select a location
            </p>
        </div>
    );
};

export default MapPicker;
