
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  History,
} from "lucide-react";

const API = "/api/v1/stock-movements";

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

function getError(error) {
  if (error.response?.status === 401) {
    return "Session expired. Please log in again.";
  }

  if (error.response?.status === 403) {
    return "You do not have permission to view stock movements.";
  }

  const data = error.response?.data;

  return (
    data?.message ||
    data?.detail ||
    error.message ||
    "Failed to load stock movements."
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-IN");
}

export default function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  async function loadMovements() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API, getAuth());
      setMovements(response.data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMovements();
  }, []);

  const totalIn = useMemo(
    () =>
      movements
        .filter((m) => m.quantityChange > 0)
        .reduce((sum, m) => sum + m.quantityChange, 0),
    [movements]
  );

  const totalOut = useMemo(
    () =>
      movements
        .filter((m) => m.quantityChange < 0)
        .reduce(
          (sum, m) => sum + Math.abs(m.quantityChange),
          0
        ),
    [movements]
  );

  const filteredMovements = movements.filter((movement) => {
    const text = [
      movement.productName,
      movement.sku,
      movement.productId,
      movement.purchaseOrderId,
      movement.salesOrderId,
    ]
      .filter((value) => value != null)
      .join(" ")
      .toLowerCase();

    const matchesSearch = text.includes(
      search.trim().toLowerCase()
    );

    const matchesFilter =
      filter === "ALL" ||
      (filter === "IN" && movement.quantityChange > 0) ||
      (filter === "OUT" && movement.quantityChange < 0);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <History className="text-blue-600" size={30} />
            Stock Movement History
          </h1>

          <p className="mt-2 text-slate-500">
            Track inventory changes from purchase and sales orders.
          </p>
        </div>

        <button
          onClick={loadMovements}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3 disabled:opacity-50"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <ArrowDownLeft
            size={24}
            className="mb-3 text-green-600"
          />
          <p className="text-sm text-slate-500">
            Total Stock In
          </p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            +{totalIn}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <ArrowUpRight
            size={24}
            className="mb-3 text-red-600"
          />
          <p className="text-sm text-slate-500">
            Total Stock Out
          </p>
          <p className="mt-2 text-3xl font-bold text-red-700">
            -{totalOut}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <History
            size={24}
            className="mb-3 text-blue-600"
          />
          <p className="text-sm text-slate-500">
            Net Stock Movement
          </p>
          <p className="mt-2 text-3xl font-bold">
            {totalIn - totalOut >= 0 ? "+" : ""}
            {totalIn - totalOut}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-xl border bg-white px-4 py-3">
          <Search size={18} className="text-slate-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search product, SKU or order ID..."
            className="w-full bg-transparent outline-none"
          />
        </div>

        <select
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value)
          }
          className="rounded-xl border bg-white px-4 py-3"
        >
          <option value="ALL">All Movements</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Movement Table */}
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center">
            Loading stock movements...
          </p>
        ) : filteredMovements.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            No stock movements found.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-4">ID</th>
                <th className="px-4 py-4">Product</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Quantity</th>
                <th className="px-4 py-4">Reference</th>
                <th className="px-4 py-4">Date</th>
              </tr>
            </thead>

            <tbody>
              {filteredMovements.map((movement) => {
                const isIn = movement.quantityChange > 0;

                const reference =
                  movement.purchaseOrderId != null
                    ? `PO #${movement.purchaseOrderId}`
                    : movement.salesOrderId != null
                    ? `SO #${movement.salesOrderId}`
                    : "Manual / Other";

                return (
                  <tr
                    key={movement.id}
                    className="border-t hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      #{movement.id}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold">
                        {movement.productName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {movement.sku}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          isIn
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isIn ? "Stock In" : "Stock Out"}
                      </span>
                    </td>

                    <td
                      className={`px-4 py-4 font-bold ${
                        isIn
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {isIn ? "+" : ""}
                      {movement.quantityChange}
                    </td>

                    <td className="px-4 py-4">
                      {reference}
                    </td>

                    <td className="px-4 py-4">
                      {formatDate(movement.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
