
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Clock3,
  BadgeCheck,
  Ban,
  X,
} from "lucide-react";

const BASE = "/api/v1";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("en-IN");
};

function errorMessage(error) {
  const data = error.response?.data;

  if (error.response?.status === 401) {
    return "Session expired. Please log in again.";
  }

  return (
    data?.message ||
    data?.detail ||
    data?.error ||
    error.message ||
    "Something went wrong."
  );
}

function authConfig() {
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

function StatusBadge({ status }) {
  const styles = {
    CREATED: "bg-amber-100 text-amber-700",
    CONFIRMED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status || "UNKNOWN"}
    </span>
  );
}

function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <Icon size={23} className={color} />
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

const emptyForm = () => ({
  customerId: "",
  items: [{ productId: "", quantity: 1, unitPrice: "" }],
});

export default function SalesOrders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showCreate, setShowCreate] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const loadOrders = useCallback(async () => {
    try {
      const response = await axios.get(
        `${BASE}/sales-orders`,
        authConfig()
      );

      setOrders(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const config = authConfig();

      const [orderRes, customerRes, productRes, inventoryRes] =
        await Promise.all([
          axios.get(`${BASE}/sales-orders`, config),
          axios.get(`${BASE}/customers`, config),
          axios.get(`${BASE}/products`, config),
          axios.get(`${BASE}/inventory`, config),
        ]);

      setOrders(
        Array.isArray(orderRes.data) ? orderRes.data : []
      );
      setCustomers(
        Array.isArray(customerRes.data) ? customerRes.data : []
      );
      setProducts(
        Array.isArray(productRes.data) ? productRes.data : []
      );
      setInventory(
        Array.isArray(inventoryRes.data)
          ? inventoryRes.data
          : []
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(
    () => ({
      total: orders.length,
      created: orders.filter(
        (o) => o.status === "CREATED"
      ).length,
      confirmed: orders.filter(
        (o) => o.status === "CONFIRMED"
      ).length,
      cancelled: orders.filter(
        (o) => o.status === "CANCELLED"
      ).length,
    }),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const customerName =
          order.customer?.name || "";

        const text = [
          order.id,
          customerName,
          order.status,
        ]
          .join(" ")
          .toLowerCase();

        return (
          text.includes(search.toLowerCase()) &&
          (statusFilter === "ALL" ||
            order.status === statusFilter)
        );
      })
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [orders, search, statusFilter]);

  function availableStock(productId) {
    const record = inventory.find(
      (item) =>
        String(item.product?.id) === String(productId)
    );

    return Number(record?.quantity || 0);
  }

  function updateItem(index, field, value) {
    setForm((previous) => {
      const items = [...previous.items];
      const item = { ...items[index] };

      item[field] = value;

      if (field === "productId") {
        const product = products.find(
          (p) => String(p.id) === String(value)
        );

        item.unitPrice =
          product?.price != null
            ? String(product.price)
            : "";
      }

      items[index] = item;

      return { ...previous, items };
    });
  }

  function addItem() {
    setForm((previous) => ({
      ...previous,
      items: [
        ...previous.items,
        { productId: "", quantity: 1, unitPrice: "" },
      ],
    }));
  }

  function removeItem(index) {
    setForm((previous) => ({
      ...previous,
      items:
        previous.items.length > 1
          ? previous.items.filter((_, i) => i !== index)
          : previous.items,
    }));
  }

  const formTotal = form.items.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity || 0) *
        Number(item.unitPrice || 0),
    0
  );

  async function createOrder(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.customerId) {
      setError("Please select a customer.");
      return;
    }

    const productIds = form.items.map(
      (item) => String(item.productId)
    );

    if (
      productIds.some((id) => !id) ||
      new Set(productIds).size !== productIds.length
    ) {
      setError(
        "Select a product for each row without duplicates."
      );
      return;
    }

    for (const item of form.items) {
      const quantity = Number(item.quantity);
      const price = Number(item.unitPrice);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        !Number.isFinite(price) ||
        price <= 0
      ) {
        setError("Enter valid quantity and product price.");
        return;
      }

      const stock = availableStock(item.productId);

      if (quantity > stock) {
        setError(
          `Insufficient stock for the selected product. Available: ${stock}, Requested: ${quantity}.`
        );
        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        customerId: Number(form.customerId),
        items: form.items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      await axios.post(
        `${BASE}/sales-orders`,
        payload,
        authConfig()
      );

      setShowCreate(false);
      setForm(emptyForm());
      setNotice(
        "Sales Order created successfully. Confirm it to deduct stock."
      );

      await loadOrders();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmOrder(order) {
    if (order.status !== "CREATED") return;

    const accepted = window.confirm(
      `Confirm Sales Order #${order.id}?\n\nThis will deduct inventory stock.`
    );

    if (!accepted) return;

    setProcessingId(order.id);
    setError("");
    setNotice("");

    try {
      await axios.patch(
        `${BASE}/sales-orders/${order.id}/confirm`,
        {},
        authConfig()
      );

      setNotice(
        `Sales Order #${order.id} confirmed successfully.`
      );

      await loadData();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function cancelOrder(order) {
    if (order.status === "CANCELLED") return;

    const message =
      order.status === "CONFIRMED"
        ? `Cancel Sales Order #${order.id}?\n\nThe deducted stock will be restored to inventory.`
        : `Cancel Sales Order #${order.id}?\n\nThis order has not deducted stock.`;

    if (!window.confirm(message)) return;

    setProcessingId(order.id);
    setError("");
    setNotice("");

    try {
      await axios.patch(
        `${BASE}/sales-orders/${order.id}/cancel`,
        {},
        authConfig()
      );

      setNotice(
        `Sales Order #${order.id} cancelled successfully.`
      );

      await loadData();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function viewOrder(orderId) {
    setError("");

    try {
      const response = await axios.get(
        `${BASE}/sales-orders/${orderId}`,
        authConfig()
      );

      setSelectedOrder(response.data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="space-y-6 text-slate-900">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <ShoppingCart
              className="text-blue-600"
              size={30}
            />
            Sales Orders
          </h1>

          <p className="mt-2 text-slate-500">
            Create, confirm, cancel and track customer orders.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button
            onClick={() => {
              setError("");
              setForm(emptyForm());
              setShowCreate(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Create Order
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Orders"
          value={summary.total}
          icon={ShoppingCart}
          color="text-blue-600"
        />
        <SummaryCard
          title="Created"
          value={summary.created}
          icon={Clock3}
          color="text-amber-600"
        />
        <SummaryCard
          title="Confirmed"
          value={summary.confirmed}
          icon={BadgeCheck}
          color="text-green-600"
        />
        <SummaryCard
          title="Cancelled"
          value={summary.cancelled}
          icon={Ban}
          color="text-red-600"
        />
      </div>

      {/* MESSAGES */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          {notice}
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-xl border bg-white px-4 py-3">
          <Search size={18} className="text-slate-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, customer or status..."
            className="w-full bg-transparent outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border bg-white px-4 py-3"
        >
          <option value="ALL">All Statuses</option>
          <option value="CREATED">Created</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center">
            Loading sales orders...
          </p>
        ) : filteredOrders.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            No sales orders found.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-4">Order ID</th>
                <th className="px-4 py-4">Customer</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Total Amount</th>
                <th className="px-4 py-4">Created At</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="px-4 py-4 font-semibold">
                    #{order.id}
                  </td>

                  <td className="px-4 py-4">
                    {order.customer?.name || "—"}
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge status={order.status} />
                  </td>

                  <td className="px-4 py-4 font-semibold">
                    {money(order.totalAmount)}
                  </td>

                  <td className="px-4 py-4">
                    {formatDate(order.createdAt)}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        title="View Order"
                        onClick={() => viewOrder(order.id)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Eye size={19} />
                      </button>

                      {order.status === "CREATED" && (
                        <button
                          title="Confirm Order"
                          disabled={processingId !== null}
                          onClick={() => confirmOrder(order)}
                          className="rounded-lg p-2 text-green-600 hover:bg-green-50 disabled:opacity-40"
                        >
                          <CheckCircle size={19} />
                        </button>
                      )}

                      {order.status !== "CANCELLED" && (
                        <button
                          title="Cancel Order"
                          disabled={processingId !== null}
                          onClick={() => cancelOrder(order)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-40"
                        >
                          <XCircle size={19} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE ORDER MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Create Sales Order
              </h2>

              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={createOrder} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Customer
                </label>

                <select
                  required
                  value={form.customerId}
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      customerId: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border px-4 py-3"
                >
                  <option value="">Select Customer</option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    Order Items
                  </h3>

                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm font-medium text-blue-600"
                  >
                    + Add Product
                  </button>
                </div>

                {form.items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border bg-slate-50 p-4"
                  >
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Product
                        </label>

                        <select
                          required
                          value={item.productId}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "productId",
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border bg-white p-3"
                        >
                          <option value="">
                            Select Product
                          </option>

                          {products.map((product) => (
                            <option
                              key={product.id}
                              value={product.id}
                            >
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Quantity
                        </label>

                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantity",
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border bg-white p-3"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Unit Price
                        </label>

                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          readOnly
                          value={item.unitPrice}
                          className="w-full rounded-lg border bg-slate-100 p-3"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Available Stock:{" "}
                        {item.productId
                          ? availableStock(item.productId)
                          : "—"}
                      </p>

                      <p className="font-semibold">
                        Subtotal:{" "}
                        {money(
                          Number(item.quantity || 0) *
                            Number(item.unitPrice || 0)
                        )}
                      </p>
                    </div>

                    {form.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="mt-3 text-sm text-red-600"
                      >
                        Remove Product
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-xl bg-blue-50 p-5">
                <span className="font-semibold">
                  Total Amount
                </span>

                <span className="text-2xl font-bold text-blue-700">
                  {money(formTotal)}
                </span>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border px-5 py-3"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ORDER MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Sales Order #{selectedOrder.id}
              </h2>

              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Status
                </span>
                <StatusBadge
                  status={selectedOrder.status}
                />
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Customer
                </span>
                <span className="font-medium">
                  {selectedOrder.customer?.name || "—"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Created At
                </span>
                <span>
                  {formatDate(selectedOrder.createdAt)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Confirmed At
                </span>
                <span>
                  {formatDate(selectedOrder.confirmedAt)}
                </span>
              </div>
            </div>

            <h3 className="mt-6 mb-3 font-bold">
              Order Items
            </h3>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Subtotal</th>
                  </tr>
                </thead>

                <tbody>
                  {(selectedOrder.items || []).map(
                    (item, index) => (
                      <tr
                        key={item.id ?? index}
                        className="border-t"
                      >
                        <td className="p-3">
                          {item.product?.name || "—"}
                        </td>
                        <td className="p-3">
                          {item.quantity}
                        </td>
                        <td className="p-3">
                          {money(item.unitPrice)}
                        </td>
                        <td className="p-3">
                          {money(item.lineTotal)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-between text-lg font-bold">
              <span>Total Amount</span>
              <span>
                {money(selectedOrder.totalAmount)}
              </span>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg border px-5 py-3"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
