
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Package,
  Users,
  Truck,
  AlertTriangle,
  ShoppingCart,
  ClipboardList,
  IndianRupee,
  TrendingDown,
  RefreshCw,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
};

const formatDate = (value) => {
  if (!value) return "—";

  // Java LocalDateTime is returned without a timezone.
  // Display the supplied local date/time without converting zones.
  return String(value).replace("T", " ").slice(0, 16);
};

function OrdersTable({ title, orders = [] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-lg font-semibold text-slate-900">
        {title}
      </h3>

      {orders.length === 0 ? (
        <p className="text-sm text-slate-500">
          No recent orders found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">Date</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr
                  key={`${order.orderType}-${order.id}`}
                  className="border-b border-slate-100"
                >
                  <td className="px-3 py-3 text-slate-800">
                    #{order.id}
                  </td>

                  <td className="px-3 py-3 text-slate-700">
                    {order.orderType ?? "—"}
                  </td>

                  <td className="px-3 py-3">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {order.status ?? "—"}
                    </span>
                  </td>

                  <td className="px-3 py-3 font-medium text-slate-800">
                    {formatCurrency(order.totalAmount)}
                  </td>

                  <td className="px-3 py-3 text-slate-600">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const token = sessionStorage.getItem("admin_token");

      if (!token) {
        throw new Error("Session expired. Please log in again.");
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [summaryResponse, analyticsResponse] =
        await Promise.all([
          axios.get("/api/v1/dashboard/summary", config),
          axios.get("/api/v1/dashboard/analytics", config),
        ]);

      setSummary(summaryResponse.data);
      setAnalytics(analyticsResponse.data);
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Session expired. Please log out and sign in again."
          : err.response?.data?.message ||
              err.message ||
              "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const cards = [
    {
      title: "Total Products",
      value: summary?.totalProducts,
      icon: Package,
    },
    {
      title: "Total Customers",
      value: summary?.totalCustomers,
      icon: Users,
    },
    {
      title: "Total Suppliers",
      value: summary?.totalSuppliers,
      icon: Truck,
    },
    {
      title: "Low Stock Products",
      value: summary?.lowStockProducts,
      icon: AlertTriangle,
    },
    {
      title: "Purchase Orders",
      value: summary?.totalPurchaseOrders,
      icon: ClipboardList,
    },
    {
      title: "Sales Orders",
      value: summary?.totalSalesOrders,
      icon: ShoppingCart,
    },
  ];

  const monthlySales = (analytics?.monthlySales ?? []).map(
    (item) => ({
      month: item.month,
      revenue: Number(item.revenue ?? 0),
    })
  );

  return (
    <div className="space-y-8 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-slate-600">
            Real-time overview of your ERP data
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {loading && (
        <p className="text-blue-600">
          Loading dashboard data...
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && summary && analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Icon size={24} />
                  </div>

                  <p className="mt-4 text-sm font-medium text-slate-600">
                    {card.title}
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-slate-900">
                    {card.value ?? "—"}
                  </h2>
                </div>
              );
            })}
          </div>

          {/* Revenue and Expenses */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <IndianRupee className="text-green-600" />
                <h3 className="text-lg font-semibold text-slate-900">
                  Total Sales Revenue
                </h3>
              </div>

              <p className="mt-5 text-3xl font-bold text-green-600">
                {formatCurrency(analytics.totalSalesRevenue)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <TrendingDown className="text-orange-600" />
                <h3 className="text-lg font-semibold text-slate-900">
                  Total Purchase Expenses
                </h3>
              </div>

              <p className="mt-5 text-3xl font-bold text-orange-600">
                {formatCurrency(analytics.totalPurchaseExpenses)}
              </p>
            </div>
          </div>

          {/* Monthly Sales Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-semibold text-slate-900">
              Monthly Sales Revenue
            </h3>

            {monthlySales.length === 0 ? (
              <p className="text-sm text-slate-500">
                No monthly sales data available.
              </p>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySales}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis dataKey="month" />
                    <YAxis width={85} />

                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(value),
                        "Revenue",
                      ]}
                    />

                    <Bar
                      dataKey="revenue"
                      fill="#2563eb"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <OrdersTable
              title="Recent Sales Orders"
              orders={analytics.recentSalesOrders ?? []}
            />

            <OrdersTable
              title="Recent Purchase Orders"
              orders={analytics.recentPurchaseOrders ?? []}
            />
          </div>
        </>
      )}
    </div>
  );
}
