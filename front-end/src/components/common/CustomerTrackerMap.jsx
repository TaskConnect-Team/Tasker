import { useEffect, useMemo, useRef, useState } from 'react';
import { APIProvider, AdvancedMarker, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { doc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../../config/firebase';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const DEFAULT_CENTER = { lat: 33.6844, lng: 73.0479 };

const toLatLng = (value) => {

    if (!value) {
        return null;
    }

    if (Array.isArray(value) && value.length === 2) {
        const [lng, lat] = value;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return { lat, lng };
        }
    }

    if (typeof value.latitude === 'number' && typeof value.longitude === 'number') {
        console.log("to lag lng ---", value)
        return { lat: value.latitude, lng: value.longitude };
    }

    if (typeof value.lat === 'number' && typeof value.lng === 'number') {
        return { lat: value.lat, lng: value.lng };
    }

    if (Array.isArray(value.coordinates) && value.coordinates.length === 2) {
        const [lng, lat] = value.coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return { lat, lng };
        }
    }

    return null;
};

const getSnapshotLocation = (value) => {
    if (!value) {
        return null;
    }

    if (typeof value.latitude === 'number' && typeof value.longitude === 'number') {
        return { lat: value.latitude, lng: value.longitude };
    }

    if (typeof value._lat === 'number' && typeof value._long === 'number') {
        return { lat: value._lat, lng: value._long };
    }

    if (typeof value.lat === 'number' && typeof value.lng === 'number') {
        return { lat: value.lat, lng: value.lng };
    }

    return null;
};

// Calculates the angle in degrees between two coordinates
const calculateBearing = (start, end) => {
    if (!start || !end) return 0;

    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;

    const dLng = toRad(end.lng - start.lng);
    const lat1 = toRad(start.lat);
    const lat2 = toRad(end.lat);

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

// 1. The Tasker Marker (Live Navigation Arrow)
const LiveTaskerMarker = ({ isStale, heading }) => (
    // The outer div handles smooth rotation when the heading changes
    <div
        className="relative flex items-center justify-center transition-transform duration-1000 ease-linear"
        style={{ transform: `rotate(${heading}deg)` }}
    >
        {/* Live Radar Pulse (Hides if the connection goes stale) */}
        {!isStale && (
            <div className="absolute inset-0 rounded-full bg-blue-500 opacity-40 animate-ping" />
        )}

        {/* Solid Navigation Arrow Icon */}
        <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-lg transition-colors duration-500 ${isStale ? 'bg-slate-400' : 'bg-blue-600'}`}>
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                {/* Standard Navigation Arrow (Points Up at 0 degrees) */}
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
            </svg>
        </div>
    </div>
);

// 2. The Destination Marker (Static Pin)
export const DestinationMarker = () => (
    <div className="relative flex items-center justify-center pb-8 drop-shadow-xl hover:scale-110 transition-transform cursor-pointer">
        <svg className="w-10 h-10 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
            {/* Classic Map Pin */}
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
    </div>
);



function CustomerTrackerMapInner({ taskId, destinationCoordinates }) {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const geometryLibrary = useMapsLibrary('geometry');
    const [trackingData, setTrackingData] = useState(null);
    const [stale, setStale] = useState(false);
    const [routePolyline, setRoutePolyline] = useState(null); // decoded path array for deviation detection
    const [routeCalculated, setRouteCalculated] = useState(false);
    const [heading, setHeading] = useState(0);
    const [hasFitBounds, setHasFitBounds] = useState(false);
    const previousLocationRef = useRef(null);
    const routePolylineRef = useRef(null); // holds the google.maps.Polyline instance
    const toastShownRef = useRef(false);

    const destination = useMemo(() => toLatLng(destinationCoordinates), [destinationCoordinates]);
    const currentLocation = useMemo(() => getSnapshotLocation(trackingData?.currentLocation), [trackingData?.currentLocation]);




    useEffect(() => {
        if (currentLocation) {
            if (previousLocationRef.current) {
                const newHeading = calculateBearing(previousLocationRef.current, currentLocation);

                // Prevent aggressive spinning if the GPS drifts slightly (only update if > 5 degrees)
                if (Math.abs(newHeading - heading) > 5) {
                    setHeading(newHeading);
                }
            }
            previousLocationRef.current = currentLocation;
        }
    }, [currentLocation]);

    useEffect(() => {
        if (!taskId) {
            return undefined;
        }

        const unsubscribe = onSnapshot(doc(db, 'tracking', taskId), (snapshot) => {
            if (!snapshot.exists()) {
                setTrackingData(null);
                return;
            }
            
            setTrackingData(snapshot.data());
        });

        return () => unsubscribe();
    }, [taskId]);

    useEffect(() => {
        if (!trackingData?.lastUpdated?.toDate) {
            setStale(false);
            return undefined;
        }

        const updateStale = () => {
            const updatedAt = trackingData.lastUpdated.toDate().getTime();
            const delta = Math.abs(Date.now() - updatedAt);
            setStale(delta > 20000);
        };

        updateStale();
        const interval = window.setInterval(updateStale, 5000);
        return () => window.clearInterval(interval);
    }, [trackingData?.lastUpdated]);

    // Route computation using the new API
    useEffect(() => {
        if (!routesLibrary || !geometryLibrary || !map || !currentLocation || !destination || routeCalculated) {
            return;
        }

        const origin = new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng);
        const dest = new window.google.maps.LatLng(destination.lat, destination.lng);

        const request = {
            origin: origin,
            destination: dest,
            travelMode: window.google.maps.TravelMode.DRIVING,
            fields: ['durationMillis', 'distanceMeters', 'path'],
        };

        routesLibrary.Route.computeRoutes(request)
            .then((response) => {
                if (response.routes && response.routes.length > 0) {
                    const route = response.routes[0];
                    if (route.path && route.path.length > 0) {

                        // 1. THE FIX: Convert raw objects with 'altitude' into strict LatLng instances
                        const cleanPath = route.path.map(coord =>
                            new window.google.maps.LatLng(coord.lat, coord.lng)
                        );
                        // 2. Pass the cleaned data to the Polyline
                        const polyline = new window.google.maps.Polyline({
                            path: cleanPath,
                            strokeColor: '#2563eb', // Blue line
                            strokeOpacity: 0.8,
                            strokeWeight: 6,
                        });

                        // 3. Clear the old line if it exists
                        if (routePolylineRef.current) {
                            routePolylineRef.current.setMap(null);
                        }
                        // 4. Attach to map and update state
                        polyline.setMap(map);
                        routePolylineRef.current = polyline;

                        setRoutePolyline(cleanPath);
                        setRouteCalculated(true);
                    }
                }
            })
            .catch((err) => {
                console.error('Route computation failed:', err);
            });
    }, [routesLibrary, geometryLibrary, map, currentLocation, destination, routeCalculated]);




    // Cleanup the polyline when the component unmounts
    useEffect(() => {
        return () => {
            if (routePolylineRef.current) {
                routePolylineRef.current.setMap(null);
                routePolylineRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!geometryLibrary || !routePolyline?.length || !currentLocation) {
            return;
        }

        const onEdge = geometryLibrary.poly.isLocationOnEdge(
            new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng),
            new window.google.maps.Polyline({ path: routePolyline }),
            0.0018,
        );

        if (!onEdge && !toastShownRef.current) {
            toastShownRef.current = true;
            toast(() => (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg">
                    <p className="font-semibold">Route deviation detected</p>
                    <p className="mt-1">The tasker moved away from the live route.</p>
                </div>
            ), { duration: 4000 });
            window.setTimeout(() => {
                toastShownRef.current = false;
            }, 6000);
        }
    }, [geometryLibrary, routePolyline, currentLocation]);

    useEffect(() => {

        if (!map || !currentLocation || !destination || hasFitBounds) {
            return;
        }
        const bounds = new window.google.maps.LatLngBounds();

        bounds.extend(currentLocation);
        bounds.extend(destination);

        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
        setHasFitBounds(true);

    }, [map, currentLocation, destination, hasFitBounds]);

    const mapCenter = currentLocation || destination || DEFAULT_CENTER;

    return (
        <div className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="h-140 w-full">
                    <Map
                        defaultCenter={mapCenter}
                        defaultZoom={15}
                        mapId="CUSTOMER_TRACKER_MAP"
                        gestureHandling="greedy"
                        disableDefaultUI
                        className="h-full w-full"
                    >
                        {destination && (
                            <AdvancedMarker position={destination} title="Destination">
                                <DestinationMarker />
                            </AdvancedMarker>
                        )}

                        {currentLocation && (
                            <AdvancedMarker position={currentLocation} title="Tasker position">
                                <LiveTaskerMarker isStale={stale} heading={heading} />
                            </AdvancedMarker>
                        )}
                    </Map>
                </div>

                <div className="absolute left-4 top-4 flex flex-col gap-2">
                    {stale ? (
                        <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 shadow-lg">
                            Reconnecting / Stale Location Data
                        </div>
                    ) : null}
                    {trackingData?.taskerId ? (
                        <div className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-lg backdrop-blur">
                            Tracking live
                        </div>
                    ) : null}
                </div>
            </div>

            {currentLocation && destination ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    Current position: {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)} · Destination: {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
                </div>
            ) : null}
        </div>
    );
}

export default function CustomerTrackerMap({ taskId, destinationCoordinates }) {


    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY to enable live tracking.
            </div>
        );
    }

    return (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['routes', 'geometry']}>
            <CustomerTrackerMapInner taskId={taskId} destinationCoordinates={destinationCoordinates} />
        </APIProvider>
    );
}