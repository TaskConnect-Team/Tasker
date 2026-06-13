import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { AlertCircle, Lock, Mail, Loader } from "lucide-react";

const AdminLogin = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();



    useEffect(() => {
        const checkExistingAuth = async () => {
            try {
                // Ping the verify route with credentials included
               const response = await api.get('/admin/verify');

                // Axios only reaches here if status is 2xx (Success)
                if (response.status === 200) {
                    // User is already logged in, redirect them immediately to dashboard
                    navigate('/admin/dashboard', { replace: true });
                }
            } catch (error) {
                // If 401/403 is thrown, token is invalid/expired. 
                // Stay on login page safely.
                console.log("No valid admin session found:", error);
            } finally {
                setLoading(false); // Stop showing a blank/loading screen
            }
        };

        checkExistingAuth();
    }, [navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!formData.email.trim() || !formData.password.trim()) {
            setError("Email and password are required");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/admin/login`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                }
            );

            // const response = await api.post('/admin/login', formData);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Login failed");
            }

            const data = await response.json();

            console.log("Login successful:", data);

            // Redirect to dashboard
            setTimeout(() => {
                navigate("/admin/dashboard");
            }, 500);

        } catch (err) {
            console.error("Login error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
                        <Lock className="text-blue-600" size={32} />
                    </div>
                    <h1 className="text-4xl font-bold text-white">TaskConnect</h1>
                    <p className="text-blue-100 mt-2">Admin Dashboard</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-lg shadow-2xl p-8 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
                        <p className="text-gray-600 text-sm mt-2">
                            Restricted access. Only authorized administrators can proceed.
                        </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="font-semibold text-red-900">Login Error</p>
                                <p className="text-red-700 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Admin Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="admin@taskconnect.com"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? (
                                <>
                                    <Loader size={20} className="animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <Lock size={20} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Security Note */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-xs text-blue-800">
                            🔒 <strong>Security Notice:</strong> This is a restricted admin panel. All access
                            is logged and monitored. Unauthorized access attempts are tracked.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-blue-100 text-sm mt-8">
                    © 2024 TaskConnect Admin. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
