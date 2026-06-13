import React from "react";
import AdminLayout from "../components/AdminLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Analytics = () => {
  // Sample data
  const userGrowthData = [
    { month: "Jan", customers: 400, taskers: 240 },
    { month: "Feb", customers: 520, taskers: 300 },
    { month: "Mar", customers: 680, taskers: 420 },
    { month: "Apr", customers: 750, taskers: 520 },
    { month: "May", customers: 890, taskers: 650 },
    { month: "Jun", customers: 1020, taskers: 780 },
  ];

  const roleDistribution = [
    { name: "Customers", value: 1020, color: "#8b5cf6" },
    { name: "Taskers", value: 780, color: "#3b82f6" },
  ];

  const COLORS = ["#8b5cf6", "#3b82f6"];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive platform analytics and insights</p>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Growth Chart */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">User Growth</h2>
              <p className="text-gray-600 text-sm mt-1">Monthly active users by role</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="customers" fill="#8b5cf6" name="Customers" />
                  <Bar dataKey="taskers" fill="#3b82f6" name="Taskers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Role Distribution */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">User Distribution</h2>
              <p className="text-gray-600 text-sm mt-1">Current user split by role</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
            <p className="text-sm font-medium text-blue-900">Total Revenue</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">$125,430</p>
            <p className="text-xs text-blue-700 mt-2">↑ 12% from last month</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
            <p className="text-sm font-medium text-green-900">Active Tasks</p>
            <p className="text-3xl font-bold text-green-600 mt-2">324</p>
            <p className="text-xs text-green-700 mt-2">45 completed this week</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-200">
            <p className="text-sm font-medium text-purple-900">User Satisfaction</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">4.8/5</p>
            <p className="text-xs text-purple-700 mt-2">Based on 2,341 reviews</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
