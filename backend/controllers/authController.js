import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const AUTH_COOKIE_NAME = "token";
const AUTH_COOKIE_MAX_AGE = 2 * 60 * 60 * 1000;
const ALLOWED_ROLES = new Set(["customer", "tasker"]);

const buildSafeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  role: user.role,
});

const createAuthToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none",
  maxAge: AUTH_COOKIE_MAX_AGE,
  path: "/",
});

const sendAuthResponse = (res, user, statusCode, message) => {
  const token = createAuthToken(user._id, user.role);

  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());

  return res.status(statusCode).json({
    message,
    user: buildSafeUser(user),
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    path: "/",
  });
};

// REGISTER USER
export const registerUser = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const incomingRole = req.body.role?.trim().toLowerCase();
    const location = req.body.city?.trim() || req.body.location?.trim() || undefined;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const role = incomingRole || "customer";

    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      location,
    });

    return sendAuthResponse(res, user, 201, "User registered successfully");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    return sendAuthResponse(res, user, 200, "Login successful");

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  return res.status(200).json({ user: buildSafeUser(req.user) });
};

export const logoutUser = async (req, res) => {
  clearAuthCookie(res);

  return res.status(200).json({ message: "Logged out successfully" });
};

export const verifyUser = getCurrentUser;