import User from "../models/User.js";

const parseCoordinate = (value) => {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
};

const normalizeGeoPoint = (value) => {
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

const buildGeoPointFromBody = (body) => {
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

const buildSafeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  role: user.role,
  profileImage: user.profileImage || null,
  tagline: user.tagline || "",
  bio: user.bio || "",
  location: user.locationLabel || user.city || "",
  geoLocation: user.location?.type === "Point" ? user.location : null,
  skills: user.skills || [],
  services: user.services || [],
  availability: user.availability ?? true,
  isVerified: user.isVerified ?? false,
  hourlyRate: user.hourlyRate ?? null,
  portfolio: user.portfolio || "",
  trustScore: user.trustScore ?? 5.0,
});

const normalizeText = (value) => (typeof value === "string" ? value.trim() : undefined);

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return undefined;
};

export const updateProfile = async (req, res) => {
  try {
    const updates = {};
    const name = normalizeText(req.body.fullName);
    const tagline = normalizeText(req.body.tagline);
    const bio = normalizeText(req.body.bio);
    const locationLabel = normalizeText(req.body.locationLabel ?? req.body.location);
    const location = buildGeoPointFromBody(req.body);
    const profileImage = normalizeText(req.body.profileImage);
    const skills = normalizeList(req.body.skills);
    const services = normalizeList(req.body.services);
    const availability = req.body.availability;
    const hourlyRate = req.body.hourlyRate;
    const portfolio = normalizeText(req.body.portfolio);

    if (name !== undefined) updates.name = name;
    if (tagline !== undefined) updates.tagline = tagline;
    if (bio !== undefined) updates.bio = bio;
    if (locationLabel !== undefined) updates.locationLabel = locationLabel;
    if (location !== undefined) updates.location = location;
    if (profileImage !== undefined) updates.profileImage = profileImage;
    if (typeof availability === "boolean") updates.availability = availability;

    console.log("updating data : ", name, tagline, bio, locationLabel, location, profileImage, skills, services, availability, hourlyRate, portfolio);

    if (req.user.role === "tasker") {
      if (typeof hourlyRate === "number") updates.hourlyRate = hourlyRate;
      if (skills !== undefined) updates.skills = skills;
      console.log("elso body : updating services :", services)
      if (portfolio !== undefined) updates.portfolio = portfolio;
    } else {
      if (bio !== undefined) updates.bio = bio;
      if (location !== undefined) updates.location = location;
    }
    if (services !== undefined) updates.services = services;
    
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: buildSafeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const saveFcmToken = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user._id;

    if (!token) {
      return res.status(400).json({ message: "token is required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { fcmTokens: token } },
      { new: true, runValidators: true },
    ).select("_id fcmTokens");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "FCM token saved successfully",
      userId: user._id.toString(),
      tokenCount: user.fcmTokens?.length ?? 0,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const removeFcmToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "token is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { fcmTokens: token } },
      { new: true },
    ).select("_id fcmTokens");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "FCM token removed successfully",
      userId: user._id.toString(),
      tokenCount: user.fcmTokens?.length ?? 0,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const memberSince = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
      : "";

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        profileImage: user.profileImage || null,
        tagline: user.tagline || "",
        bio: user.bio || "",
        location: user.locationLabel || user.city || "",
        geoLocation: user.location?.type === "Point" ? user.location : null,
        skills: user.skills || [],
        services: user.services || [],
        hourlyRate: user.hourlyRate ?? null,
        portfolio: user.portfolio || "",
        trustScore: user.trustScore ?? 5.0,
        isVerified: user.isVerified ?? false,
        memberSince,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const searchTaskers = async (req, res) => {
  try {
    const { q, skills, city, minRate, maxRate, minRating } = req.query;
    const query = { role: "tasker" };

    if (q) {
      query.name = new RegExp(q, "i");
    }

    if (skills) {
      const skillList = Array.isArray(skills)
        ? skills
        : String(skills)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

      if (skillList.length) {
        query.skills = { $in: skillList };
      }
    }

    if (city) {
      query.$or = [
        { city: new RegExp(city, "i") },
        { locationLabel: new RegExp(city, "i") },
      ];
    }

    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) query.hourlyRate.$gte = Number(minRate);
      if (maxRate) query.hourlyRate.$lte = Number(maxRate);
    }

    if (minRating) {
      query.trustScore = { $gte: Number(minRating) };
    }

    const users = await User.find(query).select("-password").sort({ createdAt: -1 });

    return res.status(200).json({
      taskers: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        profileImage: user.profileImage || null,
        tagline: user.tagline || "",
        location: user.locationLabel || user.city || "",
        geoLocation: user.location?.type === "Point" ? user.location : null,
        skills: user.skills || [],
        hourlyRate: user.hourlyRate ?? null,
        trustScore: user.trustScore ?? 5.0,
        isVerified: user.isVerified ?? false,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getNearbyTaskers = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius ?? 10);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    if (!Number.isFinite(radius) || radius <= 0) {
      return res.status(400).json({ message: "radius must be a positive number" });
    }

    const taskers = await User.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distance",
          spherical: true,
          maxDistance: radius * 1000,
          query: { role: "tasker" },
        },
      },
      {
        $project: {
          password: 0,
        },
      },
    ]);

    return res.status(200).json({
      taskers: taskers.map((tasker) => ({
        id: tasker._id.toString(),
        name: tasker.name,
        role: tasker.role,
        profileImage: tasker.profileImage || null,
        tagline: tasker.tagline || "",
        location: tasker.locationLabel || tasker.city || "",
        geoLocation: tasker.location?.type === "Point" ? tasker.location : null,
        skills: tasker.skills || [],
        services: tasker.services || [],
        hourlyRate: tasker.hourlyRate ?? null,
        trustScore: tasker.trustScore ?? 5.0,
        isVerified: tasker.isVerified ?? false,
        availability: tasker.availability ?? true,
        distanceKm: Number((tasker.distance / 1000).toFixed(2)),
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
