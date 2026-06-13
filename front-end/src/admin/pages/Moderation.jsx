import React, { useEffect, useState } from "react";
import { AlertCircle, Loader, CheckCircle, XCircle, Trash2 } from "lucide-react";
import AdminLayout from "../components/AdminLayout";

const Moderation = () => {
  const [unverifiedTaskers, setUnverifiedTaskers] = useState([]);
  const [highRiskTaskers, setHighRiskTaskers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState({});
  const [trustScoreInput, setTrustScoreInput] = useState({});

  useEffect(() => {
    fetchModerationData();
  }, []);

  const fetchModerationData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [unverifiedRes, highRiskRes] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/admin/unverified-taskers`,
          { credentials: "include" }
        ),
        fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/admin/high-risk-taskers`,
          { credentials: "include" }
        ),
      ]);

      if (!unverifiedRes.ok || !highRiskRes.ok) {
        throw new Error("Failed to fetch moderation data");
      }

      const unverifiedData = await unverifiedRes.json();
      const highRiskData = await highRiskRes.json();

      setUnverifiedTaskers(unverifiedData.taskers || []);
      setHighRiskTaskers(highRiskData.taskers || []);
    } catch (err) {
      console.error("Moderation data fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToggle = async (taskerId) => {
    try {
      setProcessing((prev) => ({ ...prev, [taskerId]: true }));

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/admin/verify-tasker/${taskerId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to verify tasker");
      }

      const result = await response.json();

      // Remove from unverified list or update status
      setUnverifiedTaskers((prev) =>
        prev.filter((t) => t._id !== taskerId)
      );

      alert(`✅ ${result.message}`);
    } catch (error) {
      console.error("Verify error:", error);
      alert("❌ Error verifying tasker");
    } finally {
      setProcessing((prev) => ({ ...prev, [taskerId]: false }));
    }
  };

  const handleTrustScoreUpdate = async (taskerId) => {
    const newScore = trustScoreInput[taskerId];

    if (!newScore || isNaN(newScore) || newScore < 0 || newScore > 10) {
      alert("❌ Trust score must be a number between 0 and 10");
      return;
    }

    try {
      setProcessing((prev) => ({ ...prev, [taskerId]: true }));

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/admin/trust-score/${taskerId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trustScore: parseFloat(newScore) }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update trust score");
      }

      const result = await response.json();

      // Update local state
      setHighRiskTaskers((prev) =>
        prev.map((t) =>
          t._id === taskerId
            ? { ...t, trustScore: parseFloat(newScore) }
            : t
        )
      );

      setTrustScoreInput((prev) => ({ ...prev, [taskerId]: "" }));
      alert("✅ Trust score updated successfully");
    } catch (error) {
      console.error("Update trust score error:", error);
      alert("❌ Error updating trust score");
    } finally {
      setProcessing((prev) => ({ ...prev, [taskerId]: false }));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading moderation data...</p>
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
            <h3 className="font-semibold text-red-900">Error Loading Moderation Data</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchModerationData}
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
          <h1 className="text-3xl font-bold text-gray-900">Trust & Moderation</h1>
          <p className="text-gray-600 mt-1">Manage tasker verification and trust scores</p>
        </div>

        {/* Unverified Taskers Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-blue-600" size={24} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Unverified Taskers</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {unverifiedTaskers.length} tasker{unverifiedTaskers.length !== 1 ? "s" : ""} awaiting verification
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviews</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {unverifiedTaskers.length > 0 ? (
                  unverifiedTaskers.map((tasker) => (
                    <tr key={tasker._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{tasker.name}</td>
                      <td className="px-6 py-4 text-gray-600">{tasker.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full text-sm">
                          ⭐ {tasker.averageRating || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{tasker.totalReviews || 0}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleVerifyToggle(tasker._id)}
                          disabled={processing[tasker._id]}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {processing[tasker._id] ? (
                            <>
                              <Loader size={16} className="animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} />
                              Verify
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p>All taskers are verified! ✅</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* High-Risk Taskers Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-600" size={24} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">High-Risk Taskers</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {highRiskTaskers.length} tasker{highRiskTaskers.length !== 1 ? "s" : ""} with low ratings
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Trust Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adjust Trust Score</th>
                </tr>
              </thead>
              <tbody>
                {highRiskTaskers.length > 0 ? (
                  highRiskTaskers.map((tasker) => (
                    <tr key={tasker._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{tasker.name}</td>
                      <td className="px-6 py-4 text-gray-600">{tasker.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                          ⭐ {tasker.averageRating}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm">
                          🔒 {tasker.trustScore}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={trustScoreInput[tasker._id] || ""}
                            onChange={(e) =>
                              setTrustScoreInput((prev) => ({
                                ...prev,
                                [tasker._id]: e.target.value,
                              }))
                            }
                            placeholder="0-10"
                            className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleTrustScoreUpdate(tasker._id)}
                            disabled={processing[tasker._id] || !trustScoreInput[tasker._id]}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {processing[tasker._id] ? (
                              <Loader size={16} className="animate-spin" />
                            ) : (
                              "Update"
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p>No high-risk taskers detected! 🎉</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Moderation;
