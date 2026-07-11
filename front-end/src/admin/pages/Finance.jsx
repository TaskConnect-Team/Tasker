import React, { useEffect, useState } from "react";
import { AlertCircle, Loader, DollarSign, CheckCircle } from "lucide-react";
import AdminLayout from "../components/AdminLayout";

const Finance = () => {
  const [payoutPipeline, setPayoutPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState({});
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    fetchPayoutPipeline();
  }, []);

  const fetchPayoutPipeline = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/admin/payout-pipeline`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payout pipeline");
      }

      const data = await response.json();
      setPayoutPipeline(data.taskers || []);
      setTotalBalance(data.totalBalance || 0);
    } catch (err) {
      console.error("Payout pipeline fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async (taskerId, taskerName, amount) => {
    const confirmed = window.confirm(
      `Process payout of Rs. ${amount.toLocaleString()} to ${taskerName}?`
    );

    if (!confirmed) return;

    try {
      setProcessing((prev) => ({ ...prev, [taskerId]: true }));

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/admin/process-payout/${taskerId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to process payout");
      }

      const result = await response.json();

      // Remove from payout pipeline
      setPayoutPipeline((prev) => prev.filter((t) => t._id !== taskerId));

      // Update total balance
      setTotalBalance((prev) => Math.max(0, prev - amount));

      alert(`✅ Payout processed! Rs. ${amount.toLocaleString()} sent to ${taskerName}`);
    } catch (error) {
      console.error("Process payout error:", error);
      alert("❌ Error processing payout");
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
            <p className="text-gray-600">Loading payout pipeline...</p>
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
            <h3 className="font-semibold text-red-900">Error Loading Payout Pipeline</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchPayoutPipeline}
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
          <h1 className="text-3xl font-bold text-gray-900">Financial Audit & Payouts</h1>
          <p className="text-gray-600 mt-1">Manage tasker payouts and financial records</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Total Pending Payouts</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  Rs. {totalBalance.toLocaleString()}
                </p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Taskers Awaiting Payout</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {payoutPipeline.length}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900">Avg Payout Amount</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  Rs. 
                  {payoutPipeline.length > 0
                    ? (totalBalance / payoutPipeline.length).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })
                    : 0}
                </p>
              </div>
              <DollarSign className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Payout Pipeline Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
            <div className="flex items-center gap-3">
              <DollarSign className="text-orange-600" size={24} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Tasker Payout Pipeline</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Process payouts for taskers with outstanding balances
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tasker Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pending Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Verified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {payoutPipeline.length > 0 ? (
                  payoutPipeline.map((tasker) => (
                    <tr key={tasker._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{tasker.name}</td>
                      <td className="px-6 py-4 text-gray-600">{tasker.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full text-sm">
                          ⭐ {tasker.averageRating || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                          Rs. {tasker.balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                            tasker.isVerified
                              ? "bg-green-50 text-green-800"
                              : "bg-yellow-50 text-yellow-800"
                          }`}
                        >
                          {tasker.isVerified ? "✅ Yes" : "⚠️ Unverified"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            handleProcessPayout(
                              tasker._id,
                              tasker.name,
                              tasker.balance
                            )
                          }
                          disabled={processing[tasker._id]}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                        >
                          {processing[tasker._id] ? (
                            <>
                              <Loader size={16} className="animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <DollarSign size={16} />
                              Process Payout
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p>No pending payouts. All taskers are paid up! 🎉</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Finance Notes */}
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Payout Management Tips</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>✅ Process payouts regularly to maintain tasker satisfaction</li>
            <li>✅ Verify tasker status before processing large payouts</li>
            <li>✅ All payout transactions are logged and auditable</li>
            <li>✅ Taskers can track their balance in their dashboard</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Finance;
