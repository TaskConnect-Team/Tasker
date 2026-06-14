import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { buildCookieOptions, buildClearCookieOptions } from "../utils/cookie.js";

const ADMIN_COOKIE_NAME = "adminToken";
const ADMIN_COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Admin Login
 * POST /api/admin/login
 * 
 * Verifies credentials against process.env.ADMIN_EMAIL and process.env.ADMIN_PASSWORD
 * Returns JWT token on success
 */
export const adminLogin = async (req, res) => {
    console.log("admin login  call ....")
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Verify credentials directly against environment variables
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD; // Store as bcrypt hash in env

        console.log("email for .evn file : ", adminEmail, "and password :", adminPasswordHash);

        if (!adminEmail || !adminPasswordHash) {
            return res.status(500).json({ message: "Admin credentials not configured" });
        }


        // Check email
        if (email.toLowerCase().trim() !== adminEmail.toLowerCase().trim()) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Check password
        // const isPasswordValid = await bcrypt.compare(password, adminPasswordHash);
        const isPasswordValid = password === adminPasswordHash;

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Create JWT token with admin role
        const token = jwt.sign(
            { role: "admin", email: adminEmail },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );
        
        // Set secure cookie
        res.cookie(ADMIN_COOKIE_NAME, token, buildCookieOptions(ADMIN_COOKIE_MAX_AGE));

        return res.status(200).json({
            message: "Admin login successful",
            admin: {
                email: adminEmail,
                role: "admin",
            },
        });
    } catch (error) {
        console.error("Admin login error:", error);
        return res.status(500).json({ message: "Server error during login" });
    }
};

/**
 * Admin Logout
 * POST /api/admin/logout
 */
export const adminLogout = (req, res) => {
    try {
        res.clearCookie(ADMIN_COOKIE_NAME, buildClearCookieOptions());

        return res.status(200).json({ message: "Admin logout successful" });
    } catch (error) {
        console.error("Admin logout error:", error);
        return res.status(500).json({ message: "Server error during logout" });
    }
};

/**
 * Verify Admin Token
 * GET /api/admin/verify
 */
export const verifyAdmin = (req, res) => {
    try {
        // Token is verified by isAdmin middleware
        return res.status(200).json({
            message: "Admin token valid",
            admin: req.admin,
        });
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(401).json({ message: "Invalid token" });
    }
};

export default { adminLogin, adminLogout, verifyAdmin };
