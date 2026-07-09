import MatchingTasksMap from '../../components/common/MatchingTasksMap';
import { useAuth } from '../../context/AuthContext';

const toLatLng = (value) => {
  if (!value || !Array.isArray(value.coordinates) || value.coordinates.length !== 2) {
    return null;
  }

  const [lng, lat] = value.coordinates;
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

function MapPage() {
  const { user } = useAuth();
  const taskerLocation = toLatLng(user?.geoLocation) || undefined;
  const taskerSkill = user?.skills || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Map</h1>
      <MatchingTasksMap taskerLocation={taskerLocation} taskerSkill={taskerSkill} />
    </div>
  );
}

export default MapPage;
