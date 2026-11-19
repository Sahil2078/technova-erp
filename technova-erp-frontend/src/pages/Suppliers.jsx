
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Truck,
  Mail,
  Phone,
} from "lucide-react";

const API = "/api/v1/suppliers";

const emptyForm = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
};

function getAuth() {
  const token = sessionStorage.getItem("admin_token");

  if (!token) {
    throw new Error("Session expired. Please login again.");
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

function getError(error) {
  if (error.response?.status === 401) {
    return "Session expired. Please login again.";
  }

  if (error.response?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  const data = error.response?.data;

  if (typeof data === "string") {
    return data;
  }

  return data?.message || error.message || "Something went wrong.";
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState(emptyForm);

  async function loadSuppliers() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API, getAuth());
      setSuppliers(response.data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  function openAddModal() {
    setEditingSupplier(null);
    setForm({ ...emptyForm });
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(supplier) {
    setEditingSupplier(supplier);

    setForm({
      name: supplier.name || "",
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });

    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingSupplier(null);
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

    const payload = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };

    if (
      !payload.name ||
      !payload.contactPerson ||
      !payload.email ||
      !payload.phone
    ) {
      setFormError("Please fill all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (!/^[0-9]{10}$/.test(payload.phone)) {
      setFormError("Phone number must contain exactly 10 digits.");
      return;
    }

    setSaving(true);

    try {
      if (editingSupplier) {
        await axios.put(
          `${API}/${editingSupplier.id}`,
          payload,
          getAuth()
        );
      } else {
        await axios.post(API, payload, getAuth());
      }

      setShowModal(false);
      setEditingSupplier(null);

      await loadSuppliers();
    } catch (err) {
      setFormError(getError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(supplier) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${supplier.name}"?`
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await axios.delete(
        `${API}/${supplier.id}`,
        getAuth()
      );

      await loadSuppliers();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  }

  const filteredSuppliers = suppliers.filter((supplier) => {
    const text = [
      supplier.name,
      supplier.contactPerson,
      supplier.email,
      supplier.phone,
      supplier.address,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 text-slate-900">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Suppliers Management
          </h1>
          <p className="mt-1 text-slate-500">
            Manage suppliers and their contact details.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadSuppliers}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 hover:bg-slate-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Truck className="text-blue-600" size={24} />
            <p className="text-slate-500">Total Suppliers</p>
          </div>
          <p className="mt-3 text-3xl font-bold">
            {suppliers.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Mail className="text-green-600" size={24} />
            <p className="text-slate-500">Registered Emails</p>
          </div>
          <p className="mt-3 text-3xl font-bold">
            {suppliers.filter((s) => s.email).length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Phone className="text-purple-600" size={24} />
            <p className="text-slate-500">Contact Numbers</p>
          </div>
          <p className="mt-3 text-3xl font-bold">
            {suppliers.filter((s) => s.phone).length}
          </p>
        </div>

      </div>

      {/* Search */}
      <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">
        <Search size={20} className="text-slate-400" />

        <input
          type="text"
          placeholder="Search supplier, contact person, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent outline-none"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Suppliers Table */}
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">

        {loading ? (
          <p className="p-8 text-center text-slate-500">
            Loading suppliers...
          </p>
        ) : filteredSuppliers.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            No suppliers found.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {[
                  "ID",
                  "Supplier Name",
                  "Contact Person",
                  "Email",
                  "Phone",
                  "Address",
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
              {filteredSuppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-4">
                    #{supplier.id}
                  </td>

                  <td className="px-4 py-4 font-semibold">
                    {supplier.name}
                  </td>

                  <td className="px-4 py-4">
                    {supplier.contactPerson}
                  </td>

                  <td className="px-4 py-4">
                    {supplier.email}
                  </td>

                  <td className="px-4 py-4">
                    {supplier.phone}
                  </td>

                  <td className="px-4 py-4">
                    {supplier.address || "—"}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">

                      <button
                        onClick={() => openEditModal(supplier)}
                        title="Edit Supplier"
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        onClick={() => handleDelete(supplier)}
                        disabled={saving}
                        title="Delete Supplier"
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingSupplier
                  ? "Edit Supplier"
                  : "Add New Supplier"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[75vh] space-y-4 overflow-y-auto pr-1"
            >

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Supplier Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Example: HP Distributors"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Contact Person *
                </label>

                <input
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={handleChange}
                  required
                  placeholder="Example: Rahul Sharma"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Email Address *
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="supplier@example.com"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Phone Number *
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  maxLength={10}
                  placeholder="10-digit phone number"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Address
                </label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter supplier address"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border px-5 py-2"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingSupplier
                    ? "Update Supplier"
                    : "Create Supplier"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
