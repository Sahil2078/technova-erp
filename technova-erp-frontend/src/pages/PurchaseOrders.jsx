
import { useEffect, useState } from "react";
import axios from "axios";
import {
  ShoppingCart,
  Plus,
  Search,
  RefreshCw,
  Eye,
  PackageCheck,
  X,
  Trash2,
} from "lucide-react";

const API = "/api/v1/purchase-orders";

const emptyItem = () => ({
  productId: "",
  quantity: "1",
  unitPrice: "",
});

function auth() {
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
    return "You do not have permission for this action.";
  }

  const data = error.response?.data;

  if (typeof data === "string") {
    return data;
  }

  return data?.message || error.message || "Request failed.";
}

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(value ?? 0));

function dateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-IN");
}

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState([emptyItem()]);

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API, auth());
      setOrders(response.data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    setOptionsLoading(true);
    setFormError("");

    try {
      const config = auth();

      const [supplierResponse, productResponse] =
        await Promise.all([
          axios.get("/api/v1/suppliers", config),
          axios.get("/api/v1/products", config),
        ]);

      setSuppliers(supplierResponse.data);
      setProducts(productResponse.data);
    } catch (err) {
      setFormError(getError(err));
    } finally {
      setOptionsLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function openCreate() {
    setSupplierId("");
    setItems([emptyItem()]);
    setFormError("");
    setShowCreate(true);
    loadOptions();
  }

  function closeCreate() {
    if (saving) return;

    setShowCreate(false);
    setFormError("");
  }

  // Product select karte hi price automatically fill hoga.
  function updateItem(index, field, value) {
    setItems((previous) =>
      previous.map((item, i) => {
        if (i !== index) return item;

        if (field === "productId") {
          const product = products.find(
            (p) => String(p.id) === String(value)
          );

          return {
            ...item,
            productId: value,
            unitPrice:
              product?.price != null
                ? String(product.price)
                : "",
          };
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  }

  function addItem() {
    setItems((previous) => [
      ...previous,
      emptyItem(),
    ]);
  }

  function removeItem(index) {
    setItems((previous) =>
      previous.filter((_, i) => i !== index)
    );
  }

  // Quantity x Product Price
  const orderTotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity);
    const price = Number(item.unitPrice);

    if (
      !Number.isFinite(quantity) ||
      !Number.isFinite(price)
    ) {
      return sum;
    }

    return sum + quantity * price;
  }, 0);

  async function createOrder(event) {
    event.preventDefault();
    setFormError("");

    if (!supplierId) {
      setFormError("Please select a supplier.");
      return;
    }

    if (items.length === 0) {
      setFormError("Add at least one product.");
      return;
    }

    const validItems = items.every((item) => {
      const quantity = Number(item.quantity);
      const price = Number(item.unitPrice);

      return (
        item.productId &&
        Number.isInteger(quantity) &&
        quantity > 0 &&
        item.unitPrice !== "" &&
        Number.isFinite(price) &&
        price >= 0.01
      );
    });

    if (!validItems) {
      setFormError(
        "Select a product with a valid price and enter a valid quantity."
      );
      return;
    }

    const productIds = items.map((item) =>
      Number(item.productId)
    );

    if (new Set(productIds).size !== productIds.length) {
      setFormError(
        "The same product cannot be added twice. Change its quantity instead."
      );
      return;
    }

    const payload = {
      supplierId: Number(supplierId),
      items: items.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    };

    setSaving(true);

    try {
      await axios.post(API, payload, auth());

      setShowCreate(false);
      await loadOrders();
    } catch (err) {
      setFormError(getError(err));
    } finally {
      setSaving(false);
    }
  }

  async function viewOrder(id) {
    setError("");

    try {
      const response = await axios.get(
        `${API}/${id}`,
        auth()
      );

      setSelectedOrder(response.data);
    } catch (err) {
      setError(getError(err));
    }
  }

  async function receiveOrder(order) {
    const confirmed = window.confirm(
      `Receive purchase order #${order.id}? Confirm that the products have been delivered.`
    );

    if (!confirmed) return;

    setBusyId(order.id);
    setError("");

    try {
      await axios.patch(
        `${API}/${order.id}/receive`,
        {},
        auth()
      );

      setSelectedOrder(null);
      await loadOrders();
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusyId(null);
    }
  }

  const filteredOrders = orders.filter((order) => {
    const text = [
      order.id,
      order.supplier?.name,
      order.status,
    ]
      .filter((value) => value != null)
      .join(" ")
      .toLowerCase();

    return (
      text.includes(search.trim().toLowerCase()) &&
      (statusFilter === "ALL" ||
        order.status === statusFilter)
    );
  });

  const createdCount = orders.filter(
    (order) => order.status === "CREATED"
  ).length;

  const receivedCount = orders.filter(
    (order) => order.status === "RECEIVED"
  ).length;

  return (
    <div className="space-y-6 text-slate-900">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Purchase Orders
          </h1>

          <p className="mt-1 text-slate-500">
            Manage supplier purchase orders and receiving.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Purchase Order
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <ShoppingCart
            size={24}
            className="mb-3 text-blue-600"
          />
          <p className="text-sm text-slate-500">
            Total Orders
          </p>
          <p className="mt-2 text-3xl font-bold">
            {orders.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <Plus
            size={24}
            className="mb-3 text-orange-600"
          />
          <p className="text-sm text-slate-500">
            Created Orders
          </p>
          <p className="mt-2 text-3xl font-bold">
            {createdCount}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <PackageCheck
            size={24}
            className="mb-3 text-green-600"
          />
          <p className="text-sm text-slate-500">
            Received Orders
          </p>
          <p className="mt-2 text-3xl font-bold">
            {receivedCount}
          </p>
        </div>
      </div>

      {/* Search and Status Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-xl border bg-white px-4 py-3">
          <Search
            size={19}
            className="text-slate-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search order ID, supplier or status..."
            className="w-full bg-transparent outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="rounded-xl border bg-white px-4 py-3"
        >
          <option value="ALL">
            All Statuses
          </option>

          {[...new Set(orders.map((o) => o.status))]
            .filter(Boolean)
            .map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center">
            Loading purchase orders...
          </p>
        ) : filteredOrders.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            No purchase orders found.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {[
                  "Order ID",
                  "Supplier",
                  "Status",
                  "Total Amount",
                  "Created At",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-4 font-semibold"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-4 font-semibold">
                    #{order.id}
                  </td>

                  <td className="px-4 py-4">
                    {order.supplier?.name ?? "—"}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        order.status === "RECEIVED"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-semibold">
                    {money(order.totalAmount)}
                  </td>

                  <td className="px-4 py-4">
                    {dateTime(order.createdAt)}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewOrder(order.id)}
                        title="View Details"
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Eye size={18} />
                      </button>

                      {order.status === "CREATED" && (
                        <button
                          onClick={() => receiveOrder(order)}
                          disabled={busyId === order.id}
                          title="Receive Order"
                          className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                        >
                          <PackageCheck size={18} />
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

      {/* Create Purchase Order Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Create Purchase Order
              </h2>

              <button
                type="button"
                onClick={closeCreate}
                disabled={saving}
              >
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={createOrder}
              className="max-h-[75vh] space-y-5 overflow-y-auto pr-1"
            >
              {/* Supplier Dropdown */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Select Supplier *
                </label>

                <select
                  value={supplierId}
                  onChange={(event) =>
                    setSupplierId(event.target.value)
                  }
                  required
                  disabled={optionsLoading}
                  className="w-full rounded-lg border p-3"
                >
                  <option value="">
                    {optionsLoading
                      ? "Loading suppliers..."
                      : "Choose Supplier"}
                  </option>

                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.id}
                      value={supplier.id}
                    >
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purchase Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    Purchase Items
                  </h3>

                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-blue-600"
                  >
                    <Plus size={16} />
                    Add Product
                  </button>
                </div>

                {items.map((item, index) => {
                  const subtotal =
                    Number(item.quantity || 0) *
                    Number(item.unitPrice || 0);

                  return (
                    <div
                      key={index}
                      className="space-y-3 rounded-xl border p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-12">

                        {/* Product */}
                        <div className="md:col-span-5">
                          <label className="mb-1 block text-sm">
                            Product *
                          </label>

                          <select
                            value={item.productId}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "productId",
                                event.target.value
                              )
                            }
                            required
                            disabled={optionsLoading}
                            className="w-full rounded-lg border p-3"
                          >
                            <option value="">
                              Select Product
                            </option>

                            {products.map((product) => (
                              <option
                                key={product.id}
                                value={product.id}
                              >
                                {product.name} ({product.sku})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="md:col-span-3">
                          <label className="mb-1 block text-sm">
                            Quantity *
                          </label>

                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "quantity",
                                event.target.value
                              )
                            }
                            required
                            className="w-full rounded-lg border p-3"
                          />
                        </div>

                        {/* Automatic Product Price */}
                        <div className="md:col-span-3">
                          <label className="mb-1 block text-sm">
                            Unit Price (₹)
                          </label>

                          <input
                            type="number"
                            value={item.unitPrice}
                            readOnly
                            required
                            placeholder="Auto-filled"
                            className="w-full rounded-lg border bg-slate-100 p-3 text-slate-700"
                          />
                        </div>

                        {/* Remove Item */}
                        <div className="flex items-end md:col-span-1">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                            title="Remove Product"
                            className="rounded-lg p-3 text-red-600 hover:bg-red-50 disabled:opacity-30"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Line Item Subtotal */}
                      <div className="text-right text-sm">
                        <span className="text-slate-500">
                          Subtotal:{" "}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {money(subtotal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grand Total */}
              <div className="rounded-xl bg-blue-50 p-5 text-right">
                <p className="text-sm text-slate-600">
                  Total Purchase Amount
                </p>

                <p className="mt-1 text-3xl font-bold text-blue-700">
                  {money(orderTotal)}
                </p>
              </div>

              {formError && (
                <p className="text-sm text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreate}
                  disabled={saving}
                  className="rounded-lg border px-5 py-2"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || optionsLoading}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Creating..."
                    : "Create Purchase Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Purchase Order #{selectedOrder.id}
              </h2>

              <button onClick={() => setSelectedOrder(null)}>
                <X size={22} />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <b>Supplier:</b>{" "}
                {selectedOrder.supplier?.name ?? "—"}
              </p>
              <p>
                <b>Status:</b> {selectedOrder.status}
              </p>
              <p>
                <b>Created:</b>{" "}
                {dateTime(selectedOrder.createdAt)}
              </p>
              <p>
                <b>Received:</b>{" "}
                {dateTime(selectedOrder.receivedAt)}
              </p>
            </div>

            <div className="mt-5 overflow-x-auto">
              <h3 className="mb-3 font-semibold">
                Order Items
              </h3>

              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3">Subtotal</th>
                  </tr>
                </thead>

                <tbody>
                  {(selectedOrder.items ?? []).map(
                    (item, index) => (
                      <tr
                        key={item.id ?? index}
                        className="border-t"
                      >
                        <td className="p-3">
                          {item.product?.name ?? "—"}
                        </td>
                        <td className="p-3">
                          {item.quantity}
                        </td>
                        <td className="p-3">
                          {money(item.unitPrice)}
                        </td>
                        <td className="p-3">
                          {money(
                            Number(item.quantity ?? 0) *
                            Number(item.unitPrice ?? 0)
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 border-t pt-4 text-right">
              <p className="text-sm text-slate-500">
                Total Amount
              </p>

              <p className="text-2xl font-bold">
                {money(selectedOrder.totalAmount)}
              </p>
            </div>

            {selectedOrder.status === "CREATED" && (
              <button
                onClick={() => receiveOrder(selectedOrder)}
                disabled={busyId === selectedOrder.id}
                className="mt-5 w-full rounded-lg bg-green-600 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {busyId === selectedOrder.id
                  ? "Receiving..."
                  : "Receive Order"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
