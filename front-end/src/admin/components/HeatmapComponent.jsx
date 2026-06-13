// import  { useEffect, useRef } from "react";
// import { Map, useMapsLibrary } from "@vis.gl/react-google-maps";

// /**
//  * HeatmapComponent
//  * Renders Google Maps heatmap layer showing task demand
//  * 
//  * IMPORTANT: The parent Map must include libraries={['visualization']}
//  * in its initialization to load the HeatmapLayer
//  */
// const HeatmapComponent = ({ coordinates = [] }) => {
//   const mapRef = useRef(null);
//   const heatmapLayerRef = useRef(null);

//   const { isLoaded } = useMapsLibrary({
//     googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
//     libraries: ["visualization"], // ✅ CRITICAL: Must include visualization library
//   });

//   useEffect(() => {
//     if (!isLoaded || !mapRef.current) return;

//     // Convert coordinates to LatLng objects
//     const heatmapData = coordinates.map(
//       (coord) =>
//         new window.google.maps.LatLng(coord.lat, coord.lng)
//     );

//     if (heatmapData.length === 0) return;

//     // Remove existing heatmap layer if any
//     if (heatmapLayerRef.current) {
//       heatmapLayerRef.current.setMap(null);
//     }

//     // Create new heatmap layer
//     heatmapLayerRef.current = new window.google.maps.visualization.HeatmapLayer({
//       data: heatmapData,
//       map: mapRef.current,
//       radius: 50,
//       opacity: 0.7,
//       gradient: [
//         "rgba(0, 255, 255, 0)",
//         "rgba(0, 255, 255, 1)",
//         "rgba(0, 191, 255, 1)",
//         "rgba(0, 127, 255, 1)",
//         "rgba(0, 63, 255, 1)",
//         "rgba(0, 0, 255, 1)",
//         "rgba(0, 0, 223, 1)",
//         "rgba(0, 0, 191, 1)",
//         "rgba(0, 0, 159, 1)",
//         "rgba(0, 0, 127, 1)",
//         "rgba(63, 0, 91, 1)",
//         "rgba(127, 0, 63, 1)",
//         "rgba(191, 0, 31, 1)",
//         "rgba(255, 0, 0, 1)",
//       ],
//     });

//     // Calculate bounds to center map
//     const bounds = new window.google.maps.LatLngBounds();
//     heatmapData.forEach((point) => bounds.extend(point));
//     mapRef.current.fitBounds(bounds);

//     return () => {
//       if (heatmapLayerRef.current) {
//         heatmapLayerRef.current.setMap(null);
//       }
//     };
//   }, [isLoaded, coordinates]);

//   if (!isLoaded) {
//     return (
//       <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
//         <p className="text-gray-600">Loading map...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200">
//       <Map
//         ref={mapRef}
//         zoom={10}
//         center={{ lat: 40.7128, lng: -74.006 }}
//         mapId="admin-heatmap"
//         options={{
//           fullscreenControl: true,
//           zoomControl: true,
//           streetViewControl: false,
//           mapTypeControl: true,
//         }}
//       />
//     </div>
//   );
// };

// export default HeatmapComponent;




import { useEffect } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

const HeatmapComponent = ({ taskCoordinates = [] }) => {
  // 1. Get the map instance that this component is sitting inside
  const map = useMap(); 
  
  // 2. Load the visualization library (this will be null for a split second)
  const visualization = useMapsLibrary('visualization'); 

  useEffect(() => {
    // 3. Wait until the map is ready, the library is loaded, and we have data
    if (!map || !visualization || !taskCoordinates || taskCoordinates.length === 0) {
      return; 
    }

    // 4. Convert your database lat/lng numbers into Google Maps LatLng objects
    const formattedData = taskCoordinates.map(
      (coord) => new window.google.maps.LatLng(coord.lat, coord.lng)
    );

    // 5. Create the heatmap layer and attach it to the map
    const heatmap = new visualization.HeatmapLayer({
      data: formattedData,
      map: map,
      radius: 40, // Adjust this number to make the heat blobs bigger or smaller
      opacity: 0.8,
    });

    // 6. Cleanup function: remove the heatmap if the component unmounts
    return () => {
      heatmap.setMap(null);
    };
  }, [map, visualization, taskCoordinates]); // Re-run if any of these change

  // Heatmap layers render directly onto the map canvas, so we return nothing here.
  return null; 
};

export default HeatmapComponent;