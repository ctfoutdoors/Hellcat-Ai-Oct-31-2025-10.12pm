import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, MapPin } from 'lucide-react';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface TrackingStop {
  id: string;
  location: string;
  coordinates: [number, number];
  timestamp: string;
  status: string;
  facilityType: 'origin' | 'hub' | 'sort_facility' | 'destination' | 'transit';
  delay?: number; // minutes
}

interface TrackingMapProps {
  trackingNumber: string;
  carrier: string;
  stops: TrackingStop[];
}

// Custom marker icons
const createCustomIcon = (type: string, isActive: boolean = false) => {
  const colors = {
    origin: '#10B981', // green
    hub: '#3B82F6', // blue
    sort_facility: '#8B5CF6', // purple
    destination: '#EF4444', // red
    transit: '#F59E0B', // orange
  };

  const color = colors[type as keyof typeof colors] || '#6B7280';
  const size = isActive ? 40 : 30;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        ${isActive ? 'animation: pulse 2s infinite;' : ''}
      ">
        <div style="
          width: ${size / 3}px;
          height: ${size / 3}px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Map controller component
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

export default function TrackingMap({ trackingNumber, carrier, stops }: TrackingMapProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [zoom, setZoom] = useState(6);
  const mapRef = useRef<L.Map | null>(null);

  // Calculate center point from all stops
  const calculateCenter = (): [number, number] => {
    if (stops.length === 0) return [39.8283, -98.5795]; // Center of USA
    
    const avgLat = stops.reduce((sum, stop) => sum + stop.coordinates[0], 0) / stops.length;
    const avgLng = stops.reduce((sum, stop) => sum + stop.coordinates[1], 0) / stops.length;
    
    return [avgLat, avgLng];
  };

  const center = calculateCenter();

  // Playback controls
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStopIndex((prev) => {
        if (prev >= stops.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000); // 2 seconds per stop

    return () => clearInterval(interval);
  }, [isPlaying, stops.length]);

  const handlePlay = () => {
    if (currentStopIndex >= stops.length - 1) {
      setCurrentStopIndex(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReplay = () => {
    setCurrentStopIndex(0);
    setIsPlaying(true);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 1, 3));
  };

  // Get visible stops up to current index
  const visibleStops = stops.slice(0, currentStopIndex + 1);
  const routeLine = visibleStops.map((stop) => stop.coordinates);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-gray-300 shadow-lg">
      {/* Map Container */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={center} zoom={zoom} />

        {/* Route polyline */}
        {routeLine.length > 1 && (
          <Polyline
            positions={routeLine}
            pathOptions={{
              color: '#3B82F6',
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 10',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Markers for each stop */}
        {visibleStops.map((stop, index) => (
          <Marker
            key={stop.id}
            position={stop.coordinates}
            icon={createCustomIcon(stop.facilityType, index === currentStopIndex)}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-sm mb-1">{stop.location}</h3>
                <p className="text-xs text-gray-600 mb-1">{stop.status}</p>
                <p className="text-xs text-gray-500">{new Date(stop.timestamp).toLocaleString()}</p>
                {stop.delay && stop.delay > 0 && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    ⚠️ Delayed by {stop.delay} minutes
                  </p>
                )}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="text-xs font-medium text-gray-700">
                    Stop {index + 1} of {stops.length}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* EFIS-Style Control Panel */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-90 text-white rounded-lg shadow-2xl p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Playback Controls */}
          <div className="flex items-center gap-2 border-r border-gray-700 pr-4">
            {!isPlaying ? (
              <button
                onClick={handlePlay}
                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                title="Play"
              >
                <Play className="w-5 h-5" fill="white" />
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                title="Pause"
              >
                <Pause className="w-5 h-5" fill="white" />
              </button>
            )}
            <button
              onClick={handleReplay}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              title="Replay"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Info */}
          <div className="flex flex-col gap-1 border-r border-gray-700 pr-4">
            <div className="text-xs font-mono">
              {trackingNumber}
            </div>
            <div className="text-xs text-gray-400">
              Stop {currentStopIndex + 1} / {stops.length}
            </div>
          </div>

          {/* Current Location */}
          <div className="flex items-center gap-2 border-r border-gray-700 pr-4">
            <MapPin className="w-4 h-4 text-blue-400" />
            <div className="flex flex-col">
              <div className="text-xs font-medium">
                {stops[currentStopIndex]?.location || 'Unknown'}
              </div>
              <div className="text-xs text-gray-400">
                {stops[currentStopIndex]?.status || 'N/A'}
              </div>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomIn}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timeline Progress Bar */}
        <div className="mt-3 w-full">
          <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 via-blue-500 to-red-500 transition-all duration-500"
              style={{ width: `${((currentStopIndex + 1) / stops.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>Origin</span>
            <span>Destination</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs">
        <h4 className="font-bold mb-2">Facility Types</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Origin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Sort Facility</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>In Transit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Destination</span>
          </div>
        </div>
      </div>
    </div>
  );
}
