
import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart3,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  RefreshCw,
  Download,
  Search,
} from "lucide-react";

const API = "/api/v1/reports";

function localDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initialDates() {
  const today = new Date();
  const firstDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  return {
    from: localDate(firstDay),
    to: localDate(today),
  };
}

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(amount ?? 0));

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("en-IN");
}

function getError(error) {
  if (error.response?.status === 401) {
    return "Session expired. Please log in again.";
  }

  if (error.response?.status === 403) {
    return "You do not have permission to view reports.";
  }

  const data = error.response?.data;

  if (typeof data === "string") return data;

  return (
    data?.message ||
    data?.detail ||
    error.message ||
    "Failed to load reports."
  );
}

function getAuth() {
  const token = sessionStorage.getItem("admin_token");

  if (!token) {
    throw new Error("Session expired. Please log in again.");
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

function SummaryCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div
        className={`mb-4 inline-flex rounded-xl p-3 ${
          colors[color] || colors.blue
        }`}
      >
        <Icon size={22} />
      </div>

      <p className="text-sm text-slate-500">{title}</p>

      <p className="mt-2 break-words text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const color =
    status === "CONFIRMED" || status === "RECEIVED"
      ? "bg-green-100 text-green-700"
      : "bg-orange-100 text-orange-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
}

function escapeCSV(value) {
  const text = String(value ?? "");

  // Prevent spreadsheet formula injection.
  const safe = /^[\s]*[=+\-@\t\r]/.test(text)
    ? `'${text}`
    : text;

  return `"${safe.replace(/"/g, '""')}"`;
}

function exportCSV(filename, headers, rows) {
  const content = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", content], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [dates, setDates] = useState(initialDates);
  const [appliedDates, setAppliedDates] = useState(initialDates);

  const [activeTab, setActiveTab] = useState("sales");
  const [search, setSearch] = useState("");

  const [salesReport, setSalesReport] = useState(null);
  const [purchaseReport, setPurchaseReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  async function loadReports(range) {
    setLoading(true);
    setError("");

    try {
      const config = {
        ...getAuth(),
        params: {
          from: range.from,
          to: range.to,
        },
      };

      const [salesResponse, purchaseResponse] =
        await Promise.all([
          axios.get(`${API}/sales`, config),
          axios.get(`${API}/purchases`, config),
        ]);

      setSalesReport(salesResponse.data);
      setPurchaseReport(purchaseResponse.data);
      setAppliedDates({ ...range });
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports(initialDates());
  }, []);

  function applyFilters(event) {
    event.preventDefault();
    setValidationError("");

    if (!dates.from || !dates.to) {
      setValidationError("Please select both dates.");
      return;
    }

    if (dates.from > dates.to) {
      setValidationError(
        "From Date cannot be after To Date."
      );
      return;
    }

    loadReports(dates);
  }

  const salesOrders = salesReport?.orders ?? [];
  const purchaseOrders = purchaseReport?.orders ?? [];

  const totalRevenue = Number(
    salesReport?.totalRevenue ?? 0
  );

  const totalExpenses = Number(
    purchaseReport?.totalExpenses ?? 0
  );

  const netDifference = totalRevenue - totalExpenses;

  const currentOrders =
    activeTab === "sales" ? salesOrders : purchaseOrders;

  const filteredOrders = currentOrders.filter((order) => {
    const values =
      activeTab === "sales"
        ? [
            order.orderId,
            order.customerName,
            order.status,
          ]
        : [
            order.orderId,
            order.supplierId,
            order.status,
          ];

    return values
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase());
  });

  function downloadReport() {
    if (loading || !salesReport || !purchaseReport) return;

    const suffix =
      `${appliedDates.from}_to_${appliedDates.to}`;

    if (activeTab === "sales") {
      exportCSV(
        `sales_report_${suffix}.csv`,
        [
          "Order ID",
          "Customer",
          "Status",
          "Total Amount",
          "Created At",
        ],
        filteredOrders.map((order) => [
          order.orderId,
          order.customerName,
          order.status,
          order.totalAmount,
          order.createdAt,
        ])
      );
    } else {
      exportCSV(
        `purchase_report_${suffix}.csv`,
        [
          "Order ID",
          "Supplier ID",
          "Status",
          "Total Amount",
          "Created At",
          "Received At",
        ],
        filteredOrders.map((order) => [
          order.orderId,
          order.supplierId,
          order.status,
          order.totalAmount,
          order.createdAt,
          order.receivedAt,
        ])
      );
    }
  }

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <BarChart3 className="text-blue-600" size={30} />
            Reports Management
          </h1>

          <p className="mt-2 text-slate-500">
            Analyze sales revenue, purchase expenses and orders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadReports(appliedDates)}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Date Filters */}
      <form
        onSubmit={applyFilters}
        className="rounded-2xl border bg-white p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={20} className="text-blue-600" />
          <h2 className="font-semibold">Date Range Filter</h2>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium">
              From Date
            </label>

            <input
              type="date"
              required
              value={dates.from}
              onChange={(event) =>
                setDates((previous) => ({
                  ...previous,
                  from: event.target.value,
                }))
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium">
              To Date
            </label>

            <input
              type="date"
              required
              value={dates.to}
              onChange={(event) =>
                setDates((previous) => ({
                  ...previous,
                  to: event.target.value,
                }))
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Generate Report"}
          </button>
        </div>

        {validationError && (
          <p className="mt-3 text-sm text-red-600">
            {validationError}
          </p>
        )}
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Sales Orders"
          value={salesReport?.totalOrders ?? "—"}
          icon={ShoppingCart}
          color="blue"
        />

        <SummaryCard
          title="Total Revenue"
          value={
            salesReport
              ? money(totalRevenue)
              : "—"
          }
          icon={TrendingUp}
          color="green"
        />

        <SummaryCard
          title="Total Purchase Orders"
          value={purchaseReport?.totalOrders ?? "—"}
          icon={ShoppingCart}
          color="purple"
        />

        <SummaryCard
          title="Total Purchase Expenses"
          value={
            purchaseReport
              ? money(totalExpenses)
              : "—"
          }
          icon={TrendingDown}
          color="orange"
        />
      </div>

      {/* Financial Comparison */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Revenue vs Purchase Expenses
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Comparison for orders created from{" "}
          {appliedDates.from} to {appliedDates.to}
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div className="rounded-xl bg-green-50 p-5">
            <p className="text-sm text-green-700">
              Confirmed Sales Revenue
            </p>
            <p className="mt-2 break-words text-2xl font-bold text-green-800">
              {salesReport ? money(totalRevenue) : "—"}
            </p>
          </div>

          <div className="rounded-xl bg-orange-50 p-5">
            <p className="text-sm text-orange-700">
              Received Purchase Expenses
            </p>
            <p className="mt-2 break-words text-2xl font-bold text-orange-800">
              {purchaseReport ? money(totalExpenses) : "—"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-100 p-5">
            <p className="text-sm text-slate-600">
              Net Difference
            </p>
            <p
              className={`mt-2 break-words text-2xl font-bold ${
                netDifference >= 0
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {salesReport && purchaseReport
                ? money(netDifference)
                : "—"}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Net Difference = Confirmed Sales Revenue −
          Received Purchase Expenses. This is not
          accounting profit.
        </p>
      </div>

      {/* Tabs and Report Table */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("sales");
                setSearch("");
              }}
              className={`rounded-lg px-4 py-2 font-medium ${
                activeTab === "sales"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              Sales Report
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("purchases");
                setSearch("");
              }}
              className={`rounded-lg px-4 py-2 font-medium ${
                activeTab === "purchases"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              Purchase Report
            </button>
          </div>

          <button
            type="button"
            onClick={downloadReport}
            disabled={
              loading || !salesReport || !purchaseReport
            }
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Download size={17} />
            Export CSV
          </button>
        </div>

        {/* Search */}
        <div className="p-5">
          <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
            <Search size={18} className="text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={
                activeTab === "sales"
                  ? "Search order ID, customer or status..."
                  : "Search order ID, supplier ID or status..."
              }
              className="w-full outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-8 text-center text-slate-500">
              Loading reports...
            </p>
          ) : !salesReport || !purchaseReport ? (
            <p className="p-8 text-center text-slate-500">
              Reports are unavailable. Try refreshing.
            </p>
          ) : filteredOrders.length === 0 ? (
            <p className="p-8 text-center text-slate-500">
              No orders found for the selected filters.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4">Order ID</th>

                  <th className="px-5 py-4">
                    {activeTab === "sales"
                      ? "Customer"
                      : "Supplier ID"}
                  </th>

                  <th className="px-5 py-4">Status</th>

                  <th className="px-5 py-4">
                    Total Amount
                  </th>

                  <th className="px-5 py-4">
                    Created At
                  </th>

                  {activeTab === "purchases" && (
                    <th className="px-5 py-4">
                      Received At
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.orderId}
                    className="border-t hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-semibold">
                      #{order.orderId}
                    </td>

                    <td className="px-5 py-4">
                      {activeTab === "sales"
                        ? order.customerName ?? "—"
                        : order.supplierId ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {money(order.totalAmount)}
                    </td>

                    <td className="px-5 py-4">
                      {formatDate(order.createdAt)}
                    </td>

                    {activeTab === "purchases" && (
                      <td className="px-5 py-4">
                        {formatDate(order.receivedAt)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t bg-slate-50 px-5 py-4 text-sm text-slate-500">
          Showing {filteredOrders.length} of{" "}
          {currentOrders.length} orders
        </div>
      </div>
    </div>
  );
}
