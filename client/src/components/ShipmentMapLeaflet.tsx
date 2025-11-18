import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MapPin, Clock, Truck, RefreshCw } from "lucide-react";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Shipment {
  id: number;
  trackingNumber: string;
  carrier: string;
  status: string;
  departureLocation: string;
  arrivalLocation: string;
  currentLocation: string;
  departureCoords: { lat: number; lng: number };
  arrivalCoords: { lat: number; lng: number };
  currentCoords: { lat: number; lng: number };
  estimatedArrival: string;
}

interface ShipmentMapProps {
  shipments: Shipment[];
  onRefresh?: () => void;
}

const statusColors: Record<string, string> = {
  in_transit: "bg-blue-500",
  delivered: "bg-green-500",
  pending: "bg-yellow-500",
  delayed: "bg-red-500",
};

export function ShipmentMapLeaflet({ shipments, onRefresh }: ShipmentMapProps) {
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    shipments.length > 0 ? shipments[0] : null
  );

  useEffect(() => {
    if (shipments.length > 0 && !selectedShipment) {
      setSelectedShipment(shipments[0]);
    }
  }, [shipments, selectedShipment]);

  if (shipments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipment Tracking Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No active shipments to display
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentShipment = selectedShipment || shipments[0];

  // Create route line from departure → current → arrival
  const routeCoordinates: [number, number][] = [
    [currentShipment.departureCoords.lat, currentShipment.departureCoords.lng],
    [currentShipment.currentCoords.lat, currentShipment.currentCoords.lng],
    [currentShipment.arrivalCoords.lat, currentShipment.arrivalCoords.lng],
  ];

  // Custom icons for different marker types
  const departureIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const arrivalIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const currentIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipment Tracking Map
          </CardTitle>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shipment selector */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Active Shipments ({shipments.length})</h4>
          <div className="grid gap-2">
            {shipments.map((shipment) => (
              <div
                key={shipment.id}
                onClick={() => setSelectedShipment(shipment)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedShipment?.id === shipment.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{shipment.carrier}</div>
                      <div className="text-xs text-muted-foreground">
                        Tracking: {shipment.trackingNumber}
                      </div>
                    </div>
                  </div>
                  <Badge className={statusColors[shipment.status] || "bg-gray-500"}>
                    {shipment.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Current: {shipment.currentLocation}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ETA: {new Date(shipment.estimatedArrival).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="h-96 rounded-lg overflow-hidden border">
          <MapContainer
            center={[currentShipment.currentCoords.lat, currentShipment.currentCoords.lng]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Route polyline */}
            <Polyline
              positions={routeCoordinates}
              color="#3b82f6"
              weight={3}
              opacity={0.7}
              dashArray="10, 10"
            />

            {/* Departure marker */}
            <Marker position={routeCoordinates[0]} icon={departureIcon}>
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">Departure</div>
                  <div>{currentShipment.departureLocation}</div>
                </div>
              </Popup>
            </Marker>

            {/* Current location marker */}
            <Marker position={routeCoordinates[1]} icon={currentIcon}>
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">Current Location</div>
                  <div>{currentShipment.currentLocation}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {currentShipment.carrier} - {currentShipment.trackingNumber}
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Arrival marker */}
            <Marker position={routeCoordinates[2]} icon={arrivalIcon}>
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">Destination</div>
                  <div>{currentShipment.arrivalLocation}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ETA: {new Date(currentShipment.estimatedArrival).toLocaleDateString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}
