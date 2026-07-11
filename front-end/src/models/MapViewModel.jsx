// frontend/src/components/common/MapViewModel.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Locate, 
  MapPin, 
  Pin, 
  X, 
  Navigation, 
  Loader2, 
  AlertCircle,
  Car,
  Footprints,
  Bike,
  Route,
  Clock,
  TrendingUp,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { 
  AdvancedMarker, 
  Map, 
  Marker, 
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

// Direction Modes
const TRAVEL_MODES = {
  DRIVING: 'DRIVING',
  WALKING: 'WALKING',
  BICYCLING: 'BICYCLING',
};

// Route Info Card Component
const RouteInfoCard = ({ route, travelMode, onModeChange, onClose }) => {
  if (!route) return null;

  const { distance, duration, steps } = route;
  
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="absolute bottom-6 left-1/2 z-10 w-[calc(100%-48px)] max-w-lg -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur-xl"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              <Route className="h-3.5 w-3.5" />
              {distance?.text || 'N/A'}
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <Clock className="h-3.5 w-3.5" />
              {duration?.text || 'N/A'}
            </div>
          </div>
          
          {/* Travel Mode Selector */}
          <div className="mt-2 flex gap-1.5">
            {Object.values(TRAVEL_MODES).map((mode) => (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  travelMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mode === 'DRIVING' && <Car className="inline h-3 w-3 mr-1" />}
                {mode === 'WALKING' && <Footprints className="inline h-3 w-3 mr-1" />}
                {mode === 'BICYCLING' && <Bike className="inline h-3 w-3 mr-1" />}
                {mode.charAt(0) + mode.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Steps Summary */}
      {steps && steps.length > 0 && (
        <div className="mt-3 max-h-20 overflow-y-auto border-t border-slate-100 pt-2 text-xs text-slate-600">
          <p className="font-medium text-slate-500 mb-1">Directions:</p>
          <div className="space-y-1">
            {steps.slice(0, 3).map((step, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="mt-0.5 text-slate-400">{index + 1}.</span>
                <span dangerouslySetInnerHTML={{ __html: step.instructions }} />
                <span className="ml-auto whitespace-nowrap text-slate-400">
                  {step.distance?.text}
                </span>
              </div>
            ))}
            {steps.length > 3 && (
              <p className="text-slate-400">+ {steps.length - 3} more steps</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Main MapViewModel Component
const MapViewModel = ({ 
  isOpen, 
  onClose, 
  mapCenter, 
  taskLocation,
  showRoute = false,
  onRouteReady,
}) => {
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [route, setRoute] = useState(null);
  const [travelMode, setTravelMode] = useState(TRAVEL_MODES.DRIVING);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [isLocating, setIsLocating] = useState(false);
  
  const mapRef = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);

  // Initialize Directions Service & Renderer
  useEffect(() => {
    if (routesLibrary && mapRef) {
      directionsServiceRef.current = new routesLibrary.DirectionsService();
      directionsRendererRef.current = new routesLibrary.DirectionsRenderer({
        map: mapRef,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#4F46E5',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });
    }
  }, [routesLibrary, mapRef]);

  // Check if geolocation is available
  const checkGeolocationSupport = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return false;
    }
    return true;
  }, []);

  // Get user's current location with permission handling
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!checkGeolocationSupport()) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      setIsLocating(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setPermissionStatus('granted');
          setIsLocating(false);
          resolve(location);
        },
        (error) => {
          setIsLocating(false);
          let errorMessage = 'Unable to get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setPermissionStatus('denied');
              errorMessage = 'Location permission denied. Please enable location services in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please try again.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = `Location error: ${error.message}`;
          }
          
          setError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }, [checkGeolocationSupport]);

  // Request location permission with user-friendly prompt
  const requestLocationPermission = useCallback(async () => {
    try {
      // First, check if permission is already granted
      if (permissionStatus === 'granted') {
        const location = await getCurrentLocation();
        return location;
      }

      // If permission was previously denied, show alert
      if (permissionStatus === 'denied') {
        
        toast.error(
          'Location access is blocked. Please enable it in your browser settings and refresh.',
          { duration: 5000 }
        );
        throw new Error('Location permission blocked');
      }

      // Show permission request alert
      const userConfirmed = window.confirm(
        '📍 TaskConnect needs your location to show the best route.\n\n' +
        'Allow location access?'
      );

      if (!userConfirmed) {
        setPermissionStatus('denied');
        throw new Error('User denied location permission');
      }

      // Attempt to get location
      const location = await getCurrentLocation();
      return location;
    } catch (error) {
      console.error('Location permission error:', error);
      throw error;
    }
  }, [permissionStatus, getCurrentLocation]);

  // Fetch route from user location to task location
  const fetchRoute = useCallback(async (origin, destination) => {
    if (!directionsServiceRef.current) {
      console.warn('Directions service not ready');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request = {
        origin: origin,
        destination: destination,
        travelMode: travelMode,
        provideRouteAlternatives: true,
      };

      const result = await new Promise((resolve, reject) => {
        directionsServiceRef.current.route(request, (response, status) => {
          if (status === 'OK') {
            resolve(response);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      // Render the route on map
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections(result);
      }

      // Extract route info
      const routeData = result.routes[0];
      const leg = routeData.legs[0];
      
      const routeInfo = {
        distance: leg.distance,
        duration: leg.duration,
        steps: leg.steps.map(step => ({
          instructions: step.instructions,
          distance: step.distance,
          duration: step.duration,
        })),
        polyline: routeData.overview_polyline,
      };

      setRoute(routeInfo);
      setIsLoading(false);

      // Notify parent
      if (onRouteReady) {
        onRouteReady(routeInfo);
      }

      toast.success('Route calculated successfully!');
      
    } catch (error) {
      console.error('Route fetch error:', error);
      setError(error.message || 'Failed to calculate route');
      setIsLoading(false);
      toast.error('Failed to calculate route. Please try again.');
    }
  }, [travelMode, onRouteReady]);

  // Handle "Get Directions" button click
  const handleGetDirections = useCallback(async () => {
    if (!mapCenter) {
      toast.error('Task location is not available');
      return;
    }

    try {
      // Get user location with permission
      const userLoc = await requestLocationPermission();
      if (!userLoc) return;

      // Fetch route
      await fetchRoute(userLoc, mapCenter);

    } catch (error) {
      console.error('Get directions error:', error);
      // Error already handled in requestLocationPermission or fetchRoute
    }
  }, [mapCenter, requestLocationPermission, fetchRoute]);

  // Clear route from map
  const clearRoute = useCallback(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
    setRoute(null);
  }, []);

  // Handle travel mode change
  const handleModeChange = useCallback(async (newMode) => {
    if (!userLocation || !mapCenter) return;
    
    setTravelMode(newMode);
    
    // Re-fetch route with new mode
    try {
      await fetchRoute(userLocation, mapCenter);
    } catch (error) {
      console.error('Failed to update route:', error);
    }
  }, [userLocation, mapCenter, fetchRoute]);

  // Update map center when location changes
  useEffect(() => {
    if (userLocation && mapRef) {
      // Optionally center map to show both locations
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(userLocation);
      bounds.extend(mapCenter);
      mapRef.fitBounds(bounds, { padding: 80 });
    }
  }, [userLocation, mapCenter, mapRef]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearRoute();
      setError(null);
    }
  }, [isOpen, clearRoute]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-default">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 p-2">
                <MapPin className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Task Location</h3>
                <p className="text-xs text-slate-500">
                  {showRoute ? 'Route from your location to task' : 'Task location on map'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Map Container */}
          <div className="relative w-full h-[65vh] min-h-[450px] bg-slate-50">
            <Map
              defaultCenter={mapCenter}
              defaultZoom={15}
              mapId="TASK_DETAIL_MAP"
              gestureHandling="greedy"
              disableDefaultUI={false}
              zoomControl={true}
              fullscreenControl={true}
            >
              {/* Task Location Marker */}
              <AdvancedMarker position={mapCenter} title="Task Location">
              </AdvancedMarker>

              {/* User Location Marker */}
              {userLocation && (
                <AdvancedMarker position={userLocation} title="Your Location">
                  <div className="relative">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 shadow-lg ring-2 ring-white animate-pulse">
                      <Navigation className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </AdvancedMarker>
              )}
            </Map>

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                  <p className="text-sm font-medium text-slate-700">Calculating best route...</p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20">
                <div className="flex flex-col items-center gap-3 max-w-md text-center">
                  <div className="rounded-full bg-red-50 p-3">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">Location Error</h4>
                  <p className="text-sm text-slate-600">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      setPermissionStatus('prompt');
                    }}
                    className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Route Info Card */}
            {route && !isLoading && (
              <RouteInfoCard
                route={route}
                travelMode={travelMode}
                onModeChange={handleModeChange}
                onClose={clearRoute}
              />
            )}
          </div>

          {/* Footer with Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="h-3.5 w-3.5 text-slate-400" />
              <span>Your location is not stored</span>
            </div>

            <div className="flex items-center gap-2">
              {showRoute && (
                <>
                  {permissionStatus === 'denied' ? (
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Location blocked</span>
                    </div>
                  ) : route ? (
                    <button
                      onClick={clearRoute}
                      className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-200"
                    >
                      Clear Route
                    </button>
                  ) : null}
                </>
              )}
              
              {!showRoute && !route && !isLoading && (
                <button
                  onClick={handleGetDirections}
                  disabled={isLocating || isLoading}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  {isLocating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                  {isLocating ? 'Getting location...' : 'Get Driving Directions'}
                </button>
              )}

              {route && (
                <div className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Route ready
                </div>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MapViewModel;