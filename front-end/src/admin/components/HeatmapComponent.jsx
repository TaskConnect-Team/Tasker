import { useEffect, useRef } from "react";
import { Map, APIProvider, useMap } from "@vis.gl/react-google-maps";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";

// 1. Core Layer Logic Sub-Component
const TaskDemandOverlay = ({ coordinates }) => {
  const map = useMap();
  const overlayRef = useRef(null);

  useEffect(() => {
    // Guard clause: Exit if map isn't drawn or if there's no demand data
    if (!map || !coordinates || coordinates.length === 0) return;

    // 2. format coordinates to match Deck.gl specifications [longitude, latitude]
    const formattedPoints = coordinates.map((point) => ({
      COORDINATES: [point.lng, point.lat], 
    }));

    // 3. Initialize the WebGL Canvas Overlay on top of Google Maps
    if (!overlayRef.current) {
      overlayRef.current = new GoogleMapsOverlay({});
      overlayRef.current.setMap(map);
    }

    // 4. Configure the Heatmap Visual properties
    const heatmapLayer = new HeatmapLayer({
      id: "task-demand-heatmap",
      data: formattedPoints,
      getPosition: (d) => d.COORDINATES,
      radiusPixels: 45,       // Size of the hot spot radius blobs
      intensity: 1,           // Scale multiplication factor
      threshold: 0.03,        // Minimal value opacity cutoff
    });

    // Feed layer array to the active map overlay engine
    overlayRef.current.setProps({ layers: [heatmapLayer] });

    // 5. Calculate boundary views to auto-center the dashboard viewport
    const bounds = new window.google.maps.LatLngBounds();
    coordinates.forEach((point) => bounds.extend({ lat: point.lat, lng: point.lng }));
    map.fitBounds(bounds);

    // 6. Memory Cleanup on unmount/update cycles
    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, coordinates]);

  return null; 
};

// Main Export Component
const HeatmapComponent = ({ coordinates = [] }) => {
  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200">
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <Map
          defaultZoom={10}
          defaultCenter={{ lat: 40.7128, lng: -74.006 }}
          mapId="admin-heatmap"
          options={{
            fullscreenControl: true,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: true,
          }}
        >
          {/* Renders safely child-nested directly into the main map structure */}
          <TaskDemandOverlay coordinates={coordinates} />
        </Map>
      </APIProvider>
    </div>
  );
};

export default HeatmapComponent;
