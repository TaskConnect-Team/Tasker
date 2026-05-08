import User from "../models/User.js";

const buildSafeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  role: user.role,
  profileImage: user.profileImage || null,
  tagline: user.tagline || "",
  bio: user.bio || "",
  location: user.location || user.city || "",
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
    const location = normalizeText(req.body.location);
    const profileImage = normalizeText(req.body.profileImage);
    const skills = normalizeList(req.body.skills);
    const services = normalizeList(req.body.services);
    const availability = req.body.availability;
    const hourlyRate = req.body.hourlyRate;
    const portfolio = normalizeList(req.body.portfolio);

    if (name !== undefined) updates.name = name;
    if (tagline !== undefined) updates.tagline = tagline;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (profileImage !== undefined) updates.profileImage = profileImage;
    if (typeof availability === "boolean") updates.availability = availability;

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
        location: user.location || user.city || "",
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
        { location: new RegExp(city, "i") },
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
        location: user.location || user.city || "",
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
