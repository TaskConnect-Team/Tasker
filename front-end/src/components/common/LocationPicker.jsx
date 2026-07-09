import { useEffect, useState } from 'react';
import { AdvancedMarker, APIProvider, Map, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { LoaderCircle, MapPin, Navigation } from 'lucide-react';
import { CITY_COORDINATES } from '../../constants/cityCoordinates';

const DEFAULT_CENTER = { lat: 33.6844, lng: 73.0479 };
const DEFAULT_ZOOM = 15;
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'taskconnect-map';
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const formatCoordinate = (value) => (Number.isFinite(value) ? value.toFixed(5) : '--');

function LocationPickerMap({ onLocationSelect, city }) {
  const apiLoaded = useApiIsLoaded();
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [markerPosition, setMarkerPosition] = useState(DEFAULT_CENTER);
  const [statusMessage, setStatusMessage] = useState('Loading map...');
  const [resolvingLocation, setResolvingLocation] = useState(true);

  useEffect(() => {
    if (!city) {
      return;
    }

    const nextCenter = CITY_COORDINATES[city];

    if (!nextCenter) {
      return;
    }

    setMapCenter(nextCenter);
    setMarkerPosition(nextCenter);
    setMapZoom(12);
    setStatusMessage(`Centered on ${city}. Drag the marker to fine-tune the location.`);
  }, [city]);

  useEffect(() => {
    let isCancelled = false;

    // Resolve the user's location once, then seed both the map center and marker position.
    const publishLocation = (nextCenter, message) => {
      if (isCancelled) {
        return;
      }

      setMapCenter(nextCenter);
      setMarkerPosition(nextCenter);
      setMapZoom(DEFAULT_ZOOM);
      setStatusMessage(message);
      setResolvingLocation(false);
      onLocationSelect?.(nextCenter);
    };

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      publishLocation(DEFAULT_CENTER, 'Geolocation is unavailable. Using the default map center.');
      return () => {
        isCancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        publishLocation(
          { lat: position.coords.latitude, lng: position.coords.longitude },
          'Drag the marker to fine-tune the selected location.',
        );
      },
      () => {
        publishLocation(DEFAULT_CENTER, 'Location permission was denied. Using the default map center.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );

    return () => {
      isCancelled = true;
    };
  }, [onLocationSelect]);

  const handleDragEnd = (event) => {
    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();

    console.log("handle drag end :", lat, lng);
    
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    // Keep the map and parent form in sync whenever the marker is repositioned.
    const nextPosition = { lat, lng };
    // setMapCenter(nextPosition);
    setMarkerPosition(nextPosition);
    // setMapZoom(DEFAULT_ZOOM);
    setStatusMessage('Location updated. You can keep dragging the pin if needed.');
    onLocationSelect?.(nextPosition);
  };

  if (!apiLoaded) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
        <div className="flex min-h-[360px] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_60%)] px-6 text-center">
          <div className="space-y-3">
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-slate-700">Loading Google Maps...</p>
            <p className="text-xs text-slate-500">Make sure the Google Maps API key is configured in Vite env variables.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-[360px] w-full">
          <Map
            mapId={MAP_ID}
            defaultCenter={mapCenter}
            defaultZoom={mapZoom}
            gestureHandling="greedy"
            disableDefaultUI
            className="h-full w-full"
          >
            <AdvancedMarker
              position={markerPosition}
              draggable
              title="Selected location"
              onDragEnd={handleDragEnd}
            />
          </Map>

          {resolvingLocation && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm font-medium text-slate-700">Resolving your current location...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">Selected coordinates</p>
            <p className="text-xs text-slate-500">
              Latitude {formatCoordinate(markerPosition.lat)} | Longitude {formatCoordinate(markerPosition.lng)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-right">
          <Navigation className="h-4 w-4" />
          <span>{statusMessage}</span>
        </div>
      </div>
    </div>
  );
}

function LocationPicker({ onLocationSelect, city }) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY to enable the location picker.
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} solutionChannel="taskconnect-location-picker">
      <LocationPickerMap onLocationSelect={onLocationSelect} city={city} />
    </APIProvider>
  );
}

export default LocationPicker;