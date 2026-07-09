import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../api/axios";

const FILTER_OPTIONS = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const initialDashboard = {
  walletBalance: 0,
  totalEarnings: 0,
  completedTasks: 0,
  platformFeesPaid: 0,
  chartData: [],
  recentPayouts: [],
};

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat();

const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
};

function EarningsPage() {
  const [filterRange, setFilterRange] = useState("monthly");
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const fetchEarnings = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/tasks/earnings", {
          params: { range: filterRange },
        });

        if (!isActive) return;

        setDashboard({
          walletBalance: data.walletBalance ?? 0,
          totalEarnings: data.totalEarnings ?? 0,
          completedTasks: data.completedTasks ?? 0,
          platformFeesPaid: data.platformFeesPaid ?? 0,
          chartData: Array.isArray(data.chartData) ? data.chartData : [],
          recentPayouts: Array.isArray(data.recentPayouts) ? data.recentPayouts : [],
        });
      } catch (fetchError) {
        if (!isActive) return;

        const message = fetchError?.response?.data?.message || "Failed to load earnings";
        setError(message);
        setDashboard(initialDashboard);
        toast.error(message);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchEarnings();

    return () => {
      isActive = false;
    };
  }, [filterRange]);

  const stats = useMemo(
    () => [
      {
        label: "Withdrawable Balance",
        value: formatCurrency(dashboard.walletBalance),
      },
      {
        label: "Lifetime Earnings",
        value: formatCurrency(dashboard.totalEarnings),
      },
      {
        label: "Tasks Completed",
        value: numberFormatter.format(Number(dashboard.completedTasks) || 0),
      },
      {
        label: "Platform Fees Paid",
        value: formatCurrency(dashboard.platformFeesPaid),
      },
    ],
    [dashboard],
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Earnings</h1>
          <p className="mt-1 text-sm">Track payouts, completed work, and recent task revenue.</p>
        </div>

        <div className="inline-flex w-full rounded-lg  border-gray-300  bg-white p-1 sm:w-auto">
          {FILTER_OPTIONS.map((option) => {
            const isSelected = filterRange === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilterRange(option.value)}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition sm:flex-none ${
                  isSelected ? "bg-gray-900 text-white" : "hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-lg border border-gray-300   bg-white p-5 shadow-sm">
            <p className="text-sm">{stat.label}</p>
            <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
          </article>
        ))}
      </div>

      <div className="rounded-lg border border-gray-300  bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Revenue Progress</h2>
          {loading ? <span className="text-sm">Refreshing...</span> : null}
        </div>

        {error ? (
          <div className="rounded-lg border  border-dashed p-8 text-center text-sm">{error}</div>
        ) : dashboard.chartData.length ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => [formatCurrency(value), "Earnings"]} />
                <Area
                  type="monotone"
                  dataKey="Earnings"
                  stroke="currentColor"
                  fill="url(#earningsFill)"
                  strokeWidth={2}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm">
            No earnings activity for this range yet.
          </div>
        )}
      </div>

      <div className="rounded-lg border border-dashed p-5 shadow-sm">
        <div className="border-b border-gray-300 p-5">
          <h2 className="text-lg font-semibold">Recent Payouts</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y text-left text-sm">
            <thead>
              <tr>
                <th className="lg:px-5 py-3 font-medium">Task</th>
                <th className="lg:px-5 py-3 font-medium">Date</th>
                <th className="lg:px-5 py-3 font-medium">Gross Total</th>
                <th className="lg:px-5 py-3 font-medium">Platform Fee</th>
                <th className="lg:px-5 py-3 font-medium">Net Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {dashboard.recentPayouts.length ? (
                dashboard.recentPayouts.map((payout) => (
                  <tr key={payout._id || `${payout.title}-${payout.createdAt}`}>
                    <td className="max-w-xs lg:lg:px-5 py-4 font-medium">
                      <span className="line-clamp-2">{payout.title || "Untitled task"}</span>
                    </td>
                    <td className="lg:px-5 py-4">{formatDate(payout.createdAt)}</td>
                    <td className="lg:px-5 py-4">{formatCurrency(payout.finalPrice ?? payout.price)}</td>
                    <td className="lg:px-5 py-4">{formatCurrency(payout.platformFee)}</td>
                    <td className="lg:px-5 py-4 font-semibold">{formatCurrency(payout.taskerEarning)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="lg:px-5 py-8 text-center">
                    No payout records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default EarningsPage;
