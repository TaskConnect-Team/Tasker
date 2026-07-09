import { useEffect, useMemo, useState } from 'react';
import { AdvancedMarker, APIProvider, InfoWindow, Map, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { LoaderCircle, MapPin, Navigation } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_CENTER = { lat:  34.12755, lng: 72.47434 };
const DEFAULT_ZOOM = 13;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const normalizeSkillList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toLatLng = (value) => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value.coordinates) && value.coordinates.length === 2) {
    const [lng, lat] = value.coordinates;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  const lat = Number(value.lat ?? value.latitude);
  const lng = Number(value.lng ?? value.longitude);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }

  return null;
};

function MarkerDot({ className }) {
  return (
    <div className={className}>
      <div className="h-3 w-3 rounded-full bg-current shadow-[0_0_0_6px_rgba(59,130,246,0.15)]" />
    </div>
  );
}

function MatchingTasksMapInner({ taskerLocation, taskerSkill }) {
  const apiLoaded = useApiIsLoaded();
  const { user } = useAuth();
  const [resolvedCenter, setResolvedCenter] = useState( toLatLng(user?.geoLocation) || taskerLocation || DEFAULT_CENTER);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const resolvedSkills = useMemo(() => {
    const skills = normalizeSkillList(taskerSkill ?? user?.skills ?? user?.services);
    return skills;
  }, [taskerSkill, user?.services, user?.skills]);

  useEffect(() => {
    let isCancelled = false;

    if (taskerLocation) {
      setResolvedCenter(taskerLocation);
      return () => {
        isCancelled = true;
      };
    }

    if (user?.geoLocation) {
      const nextCenter = toLatLng(user.geoLocation);
      if (nextCenter) {
        setResolvedCenter(nextCenter);
        return () => {
          isCancelled = true;
        };
      }
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setResolvedCenter(DEFAULT_CENTER);
      return () => {
        isCancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isCancelled) {
          return;
        }

        setResolvedCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        if (!isCancelled) {
          setResolvedCenter(DEFAULT_CENTER);
        }
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
  }, [taskerLocation, user?.geoLocation]);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    const fetchMatchingTasks = async () => {
      if (!resolvedCenter || !resolvedSkills.length) {
        setTasks([]);
        setLoadingTasks(false);
        setFetchError(resolvedSkills.length ? '' : 'Add at least one skill to your profile to see matching tasks.');
        return;
      }

      setLoadingTasks(true);
      setFetchError('');

      try {
        const { data } = await api.get('/tasks/matching-nearby', {
          params: {
            latitude: resolvedCenter.lat,
            longitude: resolvedCenter.lng,
            radius: 10,
            taskerSkill: resolvedSkills,
          },
          signal: controller.signal,
        });

        if (isCancelled) {
          return;
        }

        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      } catch (error) {
        if (!isCancelled) {
          setFetchError(error.response?.data?.message || 'Unable to load matching tasks');
          setTasks([]);
        }
      } finally {
        if (!isCancelled) {
          setLoadingTasks(false);
        }
      }
    };

    fetchMatchingTasks();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [resolvedCenter, resolvedSkills]);

  const visibleTasks = useMemo(
    () => tasks.filter((task) => toLatLng(task.geoLocation || task.location)),
    [tasks],
  );

  const activeTask = visibleTasks.find((task) => task.id === selectedTaskId) || null;
  const activeTaskPosition = activeTask ? toLatLng(activeTask.geoLocation || activeTask.location) : null;

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY to enable the matching tasks map.
      </div>
    );
  }

  if (!apiLoaded) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
        <div className="flex min-h-[540px] items-center justify-center px-6 text-center">
          <div className="space-y-3">
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-slate-700">Loading Google Maps...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-[540px] w-full">
          <Map
            mapId="MATCHING_TASKS_MAP"
            defaultCenter={resolvedCenter}
            defaultZoom={DEFAULT_ZOOM}
            gestureHandling="greedy"
            disableDefaultUI
            className="h-full w-full"
          >
            <AdvancedMarker position={resolvedCenter} title="Your location">
            </AdvancedMarker>

            {visibleTasks.map((task) => {
              const position = toLatLng(task.geoLocation || task.location);

              if (!position) {
                return null;
              }

              return (
                <AdvancedMarker
                  key={task.id}
                  position={position}
                  title={task.title}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <MarkerDot className="text-blue-500" />
                </AdvancedMarker>
              );
            })}

            {activeTask && activeTaskPosition && (
              <InfoWindow
                position={activeTaskPosition}
                onClose={() => setSelectedTaskId(null)}
                shouldFocus={false}
                minWidth={240}
              >
                <div className="space-y-2 p-1 text-slate-800">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{activeTask.title}</h3>
                    <p className="text-sm text-slate-500">{activeTask.locationLabel || activeTask.city || 'Nearby task'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Price</p>
                      <p className="font-semibold text-slate-900">${activeTask.price}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Urgency</p>
                      <p className="font-semibold text-slate-900">{activeTask.urgency || 'normal'}</p>
                    </div>
                  </div>
                  <a
                    href={`/tasks/${activeTask._id}`}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                  >
                    View Task Details
                  </a>
                </div>
              </InfoWindow>
            )}
          </Map>

          {(loadingTasks || fetchError) && (
            <div className="absolute left-4 top-4 max-w-sm rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
              {loadingTasks ? (
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                  Loading matching tasks...
                </div>
              ) : (
                <p className="text-sm text-rose-600">{fetchError}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
            <MapPin className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">Tasker location</p>
            <p className="text-xs text-slate-500">
              Latitude {resolvedCenter.lat.toFixed(5)} | Longitude {resolvedCenter.lng.toFixed(5)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-right">
          <Navigation className="h-4 w-4" />
          <span>{visibleTasks.length} matching tasks visible</span>
        </div>
      </div>
    </div>
  );
}

function MatchingTasksMap({ taskerLocation, taskerSkill }) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY to enable the matching tasks map.
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} solutionChannel="taskconnect-matching-tasks-map">
      <MatchingTasksMapInner taskerLocation={taskerLocation} taskerSkill={taskerSkill} />
    </APIProvider>
  );
}

export default MatchingTasksMap;