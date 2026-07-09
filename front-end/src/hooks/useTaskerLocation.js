import { useEffect, useRef, useState } from 'react';
import { doc, serverTimestamp, setDoc, deleteDoc, GeoPoint } from 'firebase/firestore';
import { db } from '../config/firebase';

const hasGeolocationPermission = async () => {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return true;
    try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state !== 'denied';
    } catch {
        return true;
    }
};

export default function useTaskerLocation(taskId, destinationCoordinates, taskerId, isActive = false) {
    const watchIdRef = useRef(null);
    const lastPublishTimeRef = useRef(0);
    const [permissionBlocked, setPermissionBlocked] = useState(false);

    // console.log("userTaskerLocation --------- ???????", taskId, destinationCoordinates, taskerId, isActive);

    useEffect(() => {
        // Automatically clean up the document if the task is explicitly marked inactive
        // if (!isActive && taskId) {
        //     deleteDoc(doc(db, 'tracking', taskId)).catch(console.error);
        // }

        if (!taskId || !isActive || typeof navigator === 'undefined' || !navigator.geolocation) {
            return undefined;
        }

        console.log("---------Tracking your location------------")

        let isMounted = true;
        let pageVisible = !document.hidden;
        let latestPosition = null;
        
        // Deliverable 1: 5-Second Buffer
        const THROTTLE_MS = 5000; 

        const stopWatching = () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };

        const publishPosition = async (position) => {
            if (!isMounted || !pageVisible || !position || !destinationCoordinates) return;

            const currentLocation = new GeoPoint(position.coords.latitude, position.coords.longitude);
            const destination = new GeoPoint(destinationCoordinates.lat, destinationCoordinates.lng);

            try {
                await setDoc(doc(db, 'tracking', taskId), {
                    taskerId: taskerId || '',
                    currentLocation,
                    destination,
                    status: 'in-progress',
                    lastUpdated: serverTimestamp(),
                }, { merge: true });
            } catch (err) {
                console.error("Firestore write failed:", err);
            }
        };

        const startWatching = async () => {
            const allowed = await hasGeolocationPermission();
            if (!allowed) {
                setPermissionBlocked(true);
                return;
            }

            stopWatching();

            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    latestPosition = position;
                    const now = Date.now();
                    
                    // The Guard: Only executes if 5000ms have passed since last write
                    if (now - lastPublishTimeRef.current >= THROTTLE_MS) {
                        lastPublishTimeRef.current = now;
                        publishPosition(position).catch(() => null);
                    }
                },
                (error) => {
                    if (error?.code === error.PERMISSION_DENIED) {
                        setPermissionBlocked(true);
                        stopWatching();
                    }
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            );
        };

        const handleVisibilityChange = () => {
            pageVisible = !document.hidden;
            if (!pageVisible) {
                stopWatching();
                return;
            }
            if (latestPosition) {
                lastPublishTimeRef.current = Date.now();
                publishPosition(latestPosition).catch(() => null);
            }
            startWatching().catch(() => null);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        startWatching().catch(() => null);

        return () => {
            isMounted = false;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            stopWatching();
            
            // Deliverable 2: Cleanup on unmount
            // if (taskId) {
            //     deleteDoc(doc(db, 'tracking', taskId)).catch(console.error);
            // }
        };
    }, [taskId, destinationCoordinates, taskerId, isActive]);

    return { permissionBlocked, setPermissionBlocked };
}