import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertCircle, Loader } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import KPICard from "../components/KPICard";
import { DollarSign, TrendingUp, AlertTriangle, Users } from "lucide-react";
import HeatmapComponent from "../components/HeatmapComponent";
import api from "../../api/axios";

const Dashboard = () => {
    const [kpis, setKpis] = useState(null);
    const [chartsData, setChartsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [kpisRes, chartsRes] = await Promise.all([
                api.get('/admin/kpis'),
                api.get('/admin/charts-data')
            ]);
            if (kpisRes.status !== 200 || chartsRes.status !== 200 ) {
                throw new Error("Failed to fetch dashboard data");
            }


            setKpis(kpisRes.data);
            setChartsData(chartsRes.data);
        } catch (err) {
            console.error("Dashboard data fetch error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading dashboard...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 flex items-start gap-4">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                    <div>
                        <h3 className="font-semibold text-red-900">Error Loading Dashboard</h3>
                        <p className="text-red-700 mt-1">{error}</p>
                        <button
                            onClick={fetchDashboardData}
                            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Page Title */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Real-time platform overview & analytics</p>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard
                        title="Platform Revenue"
                        value={`$${kpis?.platformRevenue?.toLocaleString() || 0}`}
                        icon={DollarSign}
                        color="green"
                    />
                    <KPICard
                        title="Escrow Balance"
                        value={`$${kpis?.escrowTracker?.toLocaleString() || 0}`}
                        icon={TrendingUp}
                        color="blue"
                    />
                    <KPICard
                        title="Urgent Tasks"
                        value={`${kpis?.urgentTaskRatio || 0}%`}
                        unit=""
                        icon={AlertTriangle}
                        color="red"
                    />
                    <KPICard
                        title="Active Taskers"
                        value={kpis?.activeTaskerSupply || 0}
                        icon={Users}
                        color="purple"
                    />
                </div>

                {/* Heatmap Section */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900">Task Demand Heatmap</h2>
                        <p className="text-gray-600 text-sm mt-1">Geographic distribution of service demand</p>
                    </div>
                    <div className="p-6">
                        {chartsData?.heatmapCoordinates && chartsData.heatmapCoordinates.length > 0 ? (
                            <HeatmapComponent coordinates={chartsData.heatmapCoordinates} />
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-12 text-center">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600">No task data available for heatmap</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cancellation Rate Chart */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900">Task Cancellation Rate</h2>
                        <p className="text-gray-600 text-sm mt-1">Daily cancellation trends over time</p>
                    </div>
                    <div className="p-6">
                        {chartsData?.cancellationData && chartsData.cancellationData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={chartsData.cancellationData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis label={{ value: "Cancellation Rate (%)", angle: -90, position: "insideLeft" }} />
                                    <Tooltip
                                        formatter={(value) => `${value.toFixed(2)}%`}
                                        labelFormatter={(label) => `Date: ${label}`}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="cancellationRate"
                                        stroke="#ef4444"
                                        name="Cancellation Rate (%)"
                                        dot={{ fill: "#ef4444" }}
                                        strokeWidth={2}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="totalTasks"
                                        stroke="#3b82f6"
                                        name="Total Tasks"
                                        yAxisId="right"
                                        strokeWidth={2}
                                    />
                                    <YAxis yAxisId="right" orientation="right" label={{ value: "Total Tasks", angle: 90, position: "insideRight" }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-12 text-center">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600">No cancellation data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                        <p className="text-sm font-medium text-blue-900">Total Platform Revenue</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                            ${kpis?.platformRevenue?.toLocaleString() || 0}
                        </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                        <p className="text-sm font-medium text-orange-900">Current Escrow</p>
                        <p className="text-3xl font-bold text-orange-600 mt-2">
                            ${kpis?.escrowTracker?.toLocaleString() || 0}
                        </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                        <p className="text-sm font-medium text-purple-900">Available Taskers</p>
                        <p className="text-3xl font-bold text-purple-600 mt-2">
                            {kpis?.activeTaskerSupply || 0}
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Dashboard;
