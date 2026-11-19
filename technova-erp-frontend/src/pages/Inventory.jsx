
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Warehouse, Plus, Search, RefreshCw, Pencil,
  Trash2, X, AlertTriangle, ArrowUpDown
} from "lucide-react";

const API = "/api/v1/inventory";

const emptyForm = {
  productId: "",
  supplierId: "",
  quantity: "0",
  minimumStock: "5",
};

function getError(err) {
  if (err.response?.status === 401)
    return "Session expired. Please log in again.";
  if (err.response?.status === 403)
    return "You do not have permission for this action.";
  return err.response?.data?.message ||
    err.message || "Request failed.";
}

function auth() {
  const token = sessionStorage.getItem("admin_token");
  if (!token) throw new Error("Please log in again.");
  return { headers: { Authorization: `Bearer ${token}` } };
}

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [adjustment, setAdjustment] = useState("0");
  const [formError, setFormError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const config = auth();
      const [inventoryRes, productsRes, suppliersRes] =
        await Promise.all([
          axios.get(API, config),
          axios.get("/api/v1/products", config),
          axios.get("/api/v1/suppliers", config),
        ]);
      setItems(inventoryRes.data);
      setProducts(productsRes.data);
      setSuppliers(suppliersRes.data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setModal("form");
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      productId: String(item.product?.id ?? ""),
      supplierId: String(item.supplier?.id ?? ""),
      quantity: String(item.quantity ?? 0),
      minimumStock: String(item.minimumStock ?? 5),
    });
    setFormError("");
    setModal("form");
  }

  function openAdjust(item) {
    setEditing(item);
    setAdjustment("0");
    setFormError("");
    setModal("adjust");
  }

  function closeModal() {
    if (!busy) {
      setModal("");
      setEditing(null);
    }
  }

  function updateForm(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function saveInventory(e) {
    e.preventDefault();
    setFormError("");

    const quantity = Number(form.quantity);
    const minimumStock = Number(form.minimumStock);

    if (!form.productId ||
        !Number.isInteger(quantity) || quantity < 0 ||
        !Number.isInteger(minimumStock) || minimumStock < 0) {
      setFormError("Select a product and enter valid stock values.");
      return;
    }

    const payload = {
      productId: Number(form.productId),
      supplierId: form.supplierId
        ? Number(form.supplierId)
        : null,
      quantity,
      minimumStock,
    };

    setBusy(true);
    try {
      if (editing) {
        await axios.put(`${API}/${editing.id}`, payload, auth());
      } else {
        await axios.post(API, payload, auth());
      }
      setModal("");
      await loadData();
    } catch (err) {
      setFormError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveAdjustment(e) {
    e.preventDefault();
    setFormError("");

    const change = Number(adjustment);

    if (!Number.isInteger(change) || change === 0) {
      setFormError("Enter a non-zero whole number.");
      return;
    }

    if ((editing.quantity ?? 0) + change < 0) {
      setFormError("Stock cannot become negative.");
      return;
    }

    setBusy(true);
    try {
      // Confirm field name with StockAdjustmentRequest.java.
      await axios.patch(
        `${API}/${editing.id}/stock`,
        { quantityChange: change },
        auth()
      );
      setModal("");
      await loadData();
    } catch (err) {
      setFormError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeInventory(item) {
    if (!window.confirm(
      `Delete inventory for ${item.product?.name ?? item.id}?`
    )) return;

    setBusy(true);
    setError("");
    try {
      await axios.delete(`${API}/${item.id}`, auth());
      await loadData();
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  const filtered = items.filter((item) => {
    const name = item.product?.name ?? "";
    const sku = item.product?.sku ?? "";
    const supplier = item.supplier?.name ?? "";
    const matches = `${name} ${sku} ${supplier}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const isLow = Number(item.quantity) <=
      Number(item.minimumStock);

    return matches && (!lowOnly || isLow);
  });

  const lowCount = items.filter(
    (item) => Number(item.quantity) <=
      Number(item.minimumStock)
  ).length;

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="mt-1 text-slate-600">
            Monitor and manage product stock.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2">
            <RefreshCw size={18}/> Refresh
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white">
            <Plus size={18}/> Add Inventory
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Inventory Records</p>
          <p className="mt-2 text-3xl font-bold">{items.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Total Units in Stock</p>
          <p className="mt-2 text-3xl font-bold">
            {items.reduce((sum, item) =>
              sum + Number(item.quantity ?? 0), 0)}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Low Stock Records</p>
          <p className="mt-2 text-3xl font-bold text-orange-600">
            {lowCount}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border bg-white px-4 py-3">
          <Search size={18} className="text-slate-400"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search product, SKU or supplier..."
            className="w-full outline-none"
          />
        </div>
        <button
          onClick={() => setLowOnly(!lowOnly)}
          className={`rounded-xl border px-4 py-3 ${
            lowOnly
              ? "bg-orange-100 text-orange-700"
              : "bg-white text-slate-700"
          }`}>
          <AlertTriangle size={17} className="mr-2 inline"/>
          Low Stock Only
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center">Loading inventory...</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            No inventory records found.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {["ID", "Product", "SKU", "Supplier",
                  "Quantity", "Minimum", "Status", "Actions"
                ].map(h => (
                  <th key={h} className="px-4 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const isLow = Number(item.quantity) <=
                  Number(item.minimumStock);
                return (
                  <tr key={item.id}
                    className="border-t border-slate-100">
                    <td className="px-4 py-4">#{item.id}</td>
                    <td className="px-4 py-4 font-medium">
                      {item.product?.name ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      {item.product?.sku ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      {item.supplier?.name ?? "—"}
                    </td>
                    <td className="px-4 py-4 font-bold">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4">
                      {item.minimumStock}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs ${
                        isLow
                          ? "bg-orange-100 text-orange-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {isLow ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openAdjust(item)}
                          title="Adjust Stock"
                          className="rounded-lg p-2 text-purple-600 hover:bg-purple-50">
                          <ArrowUpDown size={18}/>
                        </button>
                        <button onClick={() => openEdit(item)}
                          title="Edit Inventory"
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50">
                          <Pencil size={18}/>
                        </button>
                        <button onClick={() => removeInventory(item)}
                          disabled={busy}
                          title="Delete Inventory"
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {modal === "adjust"
                  ? "Adjust Stock"
                  : editing ? "Edit Inventory" : "Add Inventory"}
              </h2>
              <button onClick={closeModal} disabled={busy}>
                <X size={22}/>
              </button>
            </div>

            {modal === "adjust" ? (
              <form onSubmit={saveAdjustment} className="space-y-4">
                <p className="text-sm text-slate-600">
                  Product: {editing.product?.name}
                </p>
                <p>Current stock: <b>{editing.quantity}</b></p>
                <label className="block text-sm font-medium">
                  Quantity change (+ to add, - to remove)
                </label>
                <input type="number" step="1"
                  value={adjustment}
                  onChange={e => setAdjustment(e.target.value)}
                  className="w-full rounded-lg border p-3"/>
                {formError && <p className="text-red-600">{formError}</p>}
                <button disabled={busy}
                  className="w-full rounded-lg bg-blue-600 py-3 text-white">
                  {busy ? "Saving..." : "Adjust Stock"}
                </button>
              </form>
            ) : (
              <form onSubmit={saveInventory} className="space-y-4">
                <label className="block text-sm font-medium">
                  Product *
                </label>
                <select name="productId" value={form.productId}
                  onChange={updateForm} required
                  className="w-full rounded-lg border p-3">
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>

                <label className="block text-sm font-medium">
                  Supplier (optional)
                </label>
                <select name="supplierId" value={form.supplierId}
                  onChange={updateForm}
                  className="w-full rounded-lg border p-3">
                  <option value="">No Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name ?? `Supplier #${s.id}`}
                    </option>
                  ))}
                </select>

                <label className="block text-sm font-medium">
                  Quantity *
                </label>
                <input name="quantity" type="number" min="0" step="1"
                  value={form.quantity} onChange={updateForm} required
                  className="w-full rounded-lg border p-3"/>

                <label className="block text-sm font-medium">
                  Minimum Stock *
                </label>
                <input name="minimumStock" type="number" min="0" step="1"
                  value={form.minimumStock} onChange={updateForm} required
                  className="w-full rounded-lg border p-3"/>

                {formError && <p className="text-red-600">{formError}</p>}

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeModal}
                    disabled={busy}
                    className="rounded-lg border px-5 py-2">
                    Cancel
                  </button>
                  <button disabled={busy}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-white">
                    {busy ? "Saving..." : editing ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
