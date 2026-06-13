import React, { useState } from "react";
import { Send, AlertCircle, CheckCircle, Loader } from "lucide-react";
import AdminLayout from "../components/AdminLayout";

const Marketing = () => {
  const [formData, setFormData] = useState({
    targetRole: "all",
    title: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [notificationHistory, setNotificationHistory] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.title.trim() || !formData.message.trim()) {
      setErrorMessage("Title and message are required");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/admin/send-blast`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send notification");
      }

      const result = await response.json();

      setSuccessMessage(
        `✅ Notification sent to ${result.details.recipientCount} recipients!`
      );

      // Add to history
      setNotificationHistory((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleString(),
          ...formData,
          details: result.details,
        },
        ...prev,
      ].slice(0, 10)); // Keep last 10

      // Reset form
      setFormData({
        targetRole: "all",
        title: "",
        message: "",
      });
    } catch (error) {
      console.error("Send notification error:", error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
          <p className="text-gray-600 mt-1">Send targeted push notifications to users</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notification Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Notification</h2>

              {/* Target Role Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Target Audience 🎯
                </label>
                <select
                  name="targetRole"
                  value={formData.targetRole}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">📢 All Users</option>
                  <option value="customer">👤 Customers Only</option>
                  <option value="tasker">🔧 Taskers Only</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Select who will receive this notification
                </p>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notification Title 📝
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., New Feature Available!"
                  maxLength={100}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {formData.title.length}/100 characters
                </p>
              </div>

              {/* Message Textarea */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Message 💬
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Enter your notification message here..."
                  maxLength={500}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {formData.message.length}/500 characters
                </p>
              </div>

              {/* Success Alert */}
              {successMessage && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-green-900">Success!</h3>
                    <p className="text-green-700 text-sm mt-1">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-red-900">Error</h3>
                    <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Send Notification
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Quick Tips */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                💡 Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>✅ Keep titles short and punchy</li>
                <li>✅ Use clear call-to-action phrases</li>
                <li>✅ Target specific audiences for better engagement</li>
                <li>✅ Test messages before sending to all users</li>
                <li>✅ Avoid sending notifications too frequently</li>
              </ul>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-900 mb-4">📊 Campaign Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Total Sent:</span>
                  <span className="font-bold text-gray-900">
                    {notificationHistory.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Today:</span>
                  <span className="font-bold text-gray-900">
                    {
                      notificationHistory.filter((n) =>
                        n.timestamp.includes(new Date().toLocaleDateString())
                      ).length
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification History */}
        {notificationHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
              <h2 className="text-2xl font-bold text-gray-900">Recent Notifications</h2>
              <p className="text-gray-600 text-sm mt-1">Last 10 sent campaigns</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Audience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Recipients
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {notificationHistory.map((notification) => (
                    <tr
                      key={notification.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {notification.timestamp}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            notification.targetRole === "all"
                              ? "bg-gray-100 text-gray-800"
                              : notification.targetRole === "customer"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {notification.targetRole === "all"
                            ? "📢 All"
                            : notification.targetRole === "customer"
                            ? "👤 Customers"
                            : "🔧 Taskers"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {notification.title}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {notification.details.recipientCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Marketing;
