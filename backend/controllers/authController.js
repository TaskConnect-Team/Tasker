import User from "../models/User.js";
import Otp from "../models/Otp.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtpEmail } from "../utils/sendEmail.js";
import { buildSafeUser } from "../utils/serializeUser.js";
import { buildCookieOptions, buildClearCookieOptions } from "../utils/cookie.js";

const AUTH_COOKIE_NAME = "token";
const AUTH_COOKIE_MAX_AGE = 2 * 60 * 60 * 1000;
const ALLOWED_ROLES = new Set(["customer", "tasker"]);

const createAuthToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

const sendAuthResponse = (res, user, statusCode, message) => {
  const token = createAuthToken(user._id, user.role);

  res.cookie(AUTH_COOKIE_NAME, token, buildCookieOptions(AUTH_COOKIE_MAX_AGE));

  return res.status(statusCode).json({
    message,
    token,
    user: buildSafeUser(user),
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, buildClearCookieOptions());
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// SIGNUP USER
export const signupUser = async (req, res) => {

  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const incomingRole = req.body.role?.trim().toLowerCase();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const role = incomingRole || "customer";

    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!process.env.EMAIL_USER || !process.env.BREVO_API_KEY) {
      return res.status(500).json({ message: "Email service is not configured" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    await Otp.deleteMany({ email });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await Otp.create({
      email,
      otp: hashedOtp,
      userData: {
        name,
        password: hashedPassword,
        role,
      },
    });

    try {
      const transResult = await sendOtpEmail(email, otp);
      console.log("OTP email sent:", transResult.response);
    } catch (emailError) {
      await Otp.deleteMany({ email });
      throw emailError;
    }

    return res.status(201).json({
      message: "Verification code sent. Please check your email to complete signup.",
      email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const registerUser = signupUser;

export const verifyOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const submittedOtp = req.body.otp?.trim();

    if (!email || !submittedOtp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP has expired or is invalid" });
    }

    const isValidOtp = await bcrypt.compare(submittedOtp, otpRecord.otp);
    if (!isValidOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ message: "User already exists" });
    }

    const { name, password, role } = otpRecord.userData || {};
    if (!name || !password || !role) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ message: "Registration data has expired or is invalid" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    await Otp.deleteMany({ email });

    return sendAuthResponse(res, user, 200, "Account verified successfully");
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

  try {
    clearAuthCookie(res);
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Logout failed' });
  }
};

export const verifyUser = getCurrentUser;
