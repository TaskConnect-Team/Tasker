export const parseCoordinate = (value) => {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
};

export const normalizeGeoPoint = (value) => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  if (value.type === "Point" && Array.isArray(value.coordinates) && value.coordinates.length === 2) {
    const [lng, lat] = value.coordinates.map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { type: "Point", coordinates: [lng, lat] };
    }
  }

  const lat = parseCoordinate(value.lat ?? value.latitude);
  const lng = parseCoordinate(value.lng ?? value.longitude);

  if (lat !== null && lng !== null) {
    return { type: "Point", coordinates: [lng, lat] };
  }

  return undefined;
};

export const buildGeoPointFromBody = (body) => {
  const geoFromLocation = normalizeGeoPoint(body.location);
  if (geoFromLocation) {
    return geoFromLocation;
  }

  const lat = parseCoordinate(body.lat ?? body.latitude ?? body.locationLat);
  const lng = parseCoordinate(body.lng ?? body.longitude ?? body.locationLng);

  if (lat !== null && lng !== null) {
    return { type: "Point", coordinates: [lng, lat] };
  }

  return undefined;
};

export const buildPointFromCoordinates = (latValue, lngValue) => {
  const lat = parseCoordinate(latValue);
  const lng = parseCoordinate(lngValue);

  if (lat === null || lng === null) {
    return null;
  }

  return { type: "Point", coordinates: [lng, lat] };
};
