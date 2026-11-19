
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Package,
} from "lucide-react";

const API_URL = "/api/v1/products";

const emptyForm = {
  sku: "",
  name: "",
  brand: "",
  price: "",
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(price));

function getErrorMessage(error) {
  const data = error.response?.data;

  if (error.response?.status === 401) {
    return "Session expired. Please log out and log in again.";
  }

  if (error.response?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (typeof data === "string") return data;

  if (data?.message) return data.message;

  if (data?.errors) {
    if (Array.isArray(data.errors)) {
      return data.errors.map((e) => e.defaultMessage || e.message).join(", ");
    }
    if (typeof data.errors === "object") {
      return Object.values(data.errors).join(", ");
    }
  }

  return error.message || "Something went wrong.";
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

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

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API_URL, authConfig());
      setProducts(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(product) {
    setEditingId(product.id);
    setForm({
      sku: product.sku ?? "",
      name: product.name ?? "",
      brand: product.brand ?? "",
      price: String(product.price ?? ""),
    });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setFormError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const sku = form.sku.trim();
    const name = form.name.trim();
    const brand = form.brand.trim();
    const price = Number(form.price);

    if (!sku || !name) {
      setFormError("SKU and Product Name are required.");
      return;
    }

    if (sku.length > 50) {
      setFormError("SKU cannot exceed 50 characters.");
      return;
    }

    if (
      !form.price.trim() ||
      !Number.isFinite(price) ||
      price < 0.01 ||
      !/^\d+(\.\d{1,2})?$/.test(form.price.trim())
    ) {
      setFormError("Enter a valid price greater than zero, with up to 2 decimal places.");
      return;
    }

    setSaving(true);

    const payload = {
      sku,
      name,
      brand,
      price,
    };

    try {
      if (editingId !== null) {
        await axios.put(
          `${API_URL}/${editingId}`,
          payload,
          authConfig()
        );
      } else {
        await axios.post(API_URL, payload, authConfig());
      }

      setModalOpen(false);
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    setDeletingId(product.id);
    setError("");

    try {
      await axios.delete(
        `${API_URL}/${product.id}`,
        authConfig()
      );
      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  const filteredProducts = products.filter((product) => {
    const keyword = search.toLowerCase();

    return (
      (product.name ?? "").toLowerCase().includes(keyword) ||
      (product.sku ?? "").toLowerCase().includes(keyword) ||
      (product.brand ?? "").toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="space-y-6 text-slate-900">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Products Management
          </h1>
          <p className="mt-1 text-slate-600">
            Manage your ERP product catalog
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadProducts}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <Search size={20} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search by product name, SKU or brand..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full bg-transparent text-slate-900 outline-none"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 p-5">
          <Package className="text-blue-600" size={22} />
          <h2 className="font-semibold text-slate-900">
            All Products ({filteredProducts.length})
          </h2>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-500">
            Loading products...
          </p>
        ) : filteredProducts.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            No products found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">SKU</th>
                  <th className="px-5 py-4">Product Name</th>
                  <th className="px-5 py-4">Brand</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      #{product.id}
                    </td>

                    <td className="px-5 py-4 font-medium">
                      {product.sku}
                    </td>

                    <td className="px-5 py-4">
                      {product.name}
                    </td>

                    <td className="px-5 py-4">
                      {product.brand || "—"}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {formatPrice(product.price)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          title="Edit Product"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() => handleDelete(product)}
                          disabled={deletingId !== null}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Delete Product"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId !== null
                  ? "Edit Product"
                  : "Add New Product"}
              </h2>

              <button
                onClick={closeModal}
                disabled={saving}
                className="text-slate-500 hover:text-slate-900"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  SKU *
                </label>
                <input
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  maxLength={50}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="Example: LAP-001"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Product Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="Example: Dell Laptop"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Brand
                </label>
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="Example: Dell"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Price (INR) *
                </label>
                <input
                  type="number"
                  name="price"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="Example: 55000"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-5 py-2 text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Product"
                      : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
