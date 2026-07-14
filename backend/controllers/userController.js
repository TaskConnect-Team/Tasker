import User from "../models/User.js";
import { buildGeoPointFromBody } from "../utils/geo.js";
import { normalizeList, normalizeText } from "../utils/normalize.js";
import { buildSafeUser } from "../utils/serializeUser.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const updateProfile = async (req, res) => {
  try {
    const updates = {};
    const name = normalizeText(req.body.fullName);
    const tagline = normalizeText(req.body.tagline);
    const bio = normalizeText(req.body.bio);
    const city = normalizeText(req.body.city ?? req.body.location);
    const location = buildGeoPointFromBody(req.body);
    const profileImage = normalizeText(req.body.profileImage);
    const skills = req.body.skills !== undefined ? normalizeList(req.body.skills) : undefined;
    const services = req.body.services !== undefined ? normalizeList(req.body.services) : undefined;
    const availability = req.body.availability;
    const hourlyRate = req.body.hourlyRate;
    const portfolio = normalizeText(req.body.portfolio);

    if (name !== undefined) updates.name = name;
    if (tagline !== undefined) updates.tagline = tagline;
    if (bio !== undefined) updates.bio = bio;
    if (city !== undefined) updates.city = city;
    if (location !== undefined) updates.location = location;
    if (profileImage !== undefined) updates.profileImage = profileImage;
    if (typeof availability === "boolean") updates.availability = availability;
    if (services !== undefined) updates.services = services;

    if (req.user.role === "tasker") {
      if (typeof hourlyRate === "number") updates.hourlyRate = hourlyRate;
      if (skills !== undefined) updates.skills = skills;
      if (portfolio !== undefined) updates.portfolio = portfolio;
    } else {
      if (bio !== undefined) updates.bio = bio;
      if (location !== undefined) updates.location = location;
    }

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
        ...buildSafeUser(user),
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

    if (!q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    if (q) {
      query.name = new RegExp(escapeRegex(q), "i");
    }

    if (skills) {
      const skillList = normalizeList(skills);

      if (skillList.length) {
        query.skills = { $in: skillList };
      }
    }

    if (city) {
      query.$or = [
        { city: new RegExp(escapeRegex(city), "i") },
        { locationLabel: new RegExp(escapeRegex(city), "i") },
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
      taskers: users.map((user) => buildSafeUser(user)),
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
        ...buildSafeUser(tasker),
        distanceKm: Number((tasker.distance / 1000).toFixed(2)),
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
