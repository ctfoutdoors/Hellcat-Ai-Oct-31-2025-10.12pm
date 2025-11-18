import { useEffect, useRef, useState } from "react";
import { MapView } from "./Map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MapPin, Clock, Truck, RefreshCw } from "lucide-react";

interface Shipment {
  id: number;
  trackingNumber: string;
  carrier: string;
  status: string;
  originAddress: string;
  destinationAddress: string;
  currentLocation?: string;
  estimatedDelivery?: Date;
  shipDate?: Date;
}

interface ShipmentMapProps {
  shipments: Shipment[];
  onRefresh?: () => void;
}

export function ShipmentMap({ shipments, onRefresh }: ShipmentMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    shipments.length > 0 ? shipments[0] : null
  );
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);

  const handleMapReady = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    // Initialize Google Maps services
    const directionsServiceInstance = new google.maps.DirectionsService();
    const directionsRendererInstance = new google.maps.DirectionsRenderer({
      map: mapInstance,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#3B82F6",
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
    });
    
    setDirectionsService(directionsServiceInstance);
    setDirectionsRenderer(directionsRendererInstance);
  };

  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer || !selectedShipment) return;

    // Calculate and display route
    directionsService.route(
      {
        origin: selectedShipment.originAddress,
        destination: selectedShipment.destinationAddress,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          directionsRenderer.setDirections(result);
          
          // Extract route information
          const route = result.routes[0];
          if (route && route.legs[0]) {
            setRouteInfo({
              distance: route.legs[0].distance?.text || "N/A",
              duration: route.legs[0].duration?.text || "N/A",
            });
          }

          // Add current location marker if available
          if (selectedShipment.currentLocation) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode(
              { address: selectedShipment.currentLocation },
              (results, status) => {
                if (status === "OK" && results && results[0]) {
                  new google.maps.Marker({
                    position: results[0].geometry.location,
                    map: map,
                    icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: "#10B981",
                      fillOpacity: 1,
                      strokeColor: "#FFFFFF",
                      strokeWeight: 2,
                    },
                    title: "Current Location",
                  });
                }
              }
            );
          }
        } else {
          console.error("Directions request failed:", status);
        }
      }
    );
  }, [map, directionsService, directionsRenderer, selectedShipment]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-500";
      case "in_transit":
      case "in transit":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      case "exception":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Map View */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Shipment Tracking Map</CardTitle>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="h-[500px] rounded-lg overflow-hidden border">
              <MapView onMapReady={handleMapReady} />
            </div>
            
            {routeInfo && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="font-semibold">{routeInfo.distance}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Time</p>
                    <p className="font-semibold">{routeInfo.duration}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shipment List */}
      <div className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Shipments ({shipments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {shipments.map((shipment) => (
              <div
                key={shipment.id}
                className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                  selectedShipment?.id === shipment.id
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedShipment(shipment)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{shipment.carrier}</span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(shipment.status)}`}>
                    {shipment.status}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Tracking:</span>
                    <span className="font-mono">{shipment.trackingNumber}</span>
                  </div>
                  
                  {shipment.estimatedDelivery && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">ETA:</span>
                      <span>{new Date(shipment.estimatedDelivery).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {shipment.currentLocation && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-green-500" />
                      <span className="text-muted-foreground">Current:</span>
                      <span className="truncate">{shipment.currentLocation}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {shipments.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No active shipments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
