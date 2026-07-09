import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateAdminRoute from "./PrivateAdminRoute";

// Admin Pages
import AdminLogin from "../pages/AdminLogin";
import Dashboard from "../pages/Dashboard";
import Moderation from "../pages/Moderation";
import Finance from "../pages/Finance";
import Marketing from "../pages/Marketing";
import Analytics from "../pages/Analytics";

/**
 * AdminRouter
 * Routes for admin dashboard and pages
 * Exports routes to be included in main AppRouter
 */
const AdminRouter = () => {
  return (
    <Routes>
      {/* Public Route: Admin Login */}
      <Route path="/login" element={<AdminLogin />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateAdminRoute>
            <Dashboard />
          </PrivateAdminRoute>
        }
      />

      <Route
        path="/moderation"
        element={
          <PrivateAdminRoute>
            <Moderation />
          </PrivateAdminRoute>
        }
      />

      <Route
        path="/finance"
        element={
          <PrivateAdminRoute>
            <Finance />
          </PrivateAdminRoute>
        }
      />

      <Route
        path="/marketing"
        element={
          <PrivateAdminRoute>
            <Marketing />
          </PrivateAdminRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <PrivateAdminRoute>
            <Analytics />
          </PrivateAdminRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
};

export default AdminRouter;
