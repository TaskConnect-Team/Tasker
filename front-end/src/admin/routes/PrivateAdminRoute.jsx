import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../../api/axios";

/**
 * PrivateAdminRoute wrapper
 * Checks for admin JWT token and redirects to admin login if not authenticated
 */
const PrivateAdminRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const verifyAdminToken = async () => {
            console.log("verifying admin ....")
            try {
                const response = await api.get('/admin/verify');
                setIsAuthenticated(response.status === 200);
                console.log("verification success:", response);
                console.log("isAuthenticated:", isAuthenticated);
            } catch (error) {
                console.error("Token verification error:", error);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        verifyAdminToken();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                    </div>
                    <p className="text-gray-600">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }


    return children;
};

export default PrivateAdminRoute;
