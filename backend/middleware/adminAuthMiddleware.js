import jwt from "jsonwebtoken";

/**
 * Admin-only middleware to verify JWT and ensure admin role
 * Protects all admin API routes
 */
export const isAdmin = async (req, res, next) => {
  try {

    const token = req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the token has admin flag
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token or unauthorized access" });
  }
};

export default isAdmin;
