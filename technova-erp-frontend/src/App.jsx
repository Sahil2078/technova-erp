import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import PurchaseOrders from "./pages/PurchaseOrders";
import SalesOrders from "./pages/SalesOrders";
import StockMovements from "./pages/StockMovements";
import Reports from "./pages/Reports";


import { useState } from "react";
import axios from "axios";
import { LockKeyhole, Mail, Boxes, Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(
    () => sessionStorage.getItem("admin_token") || ""
  );
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("/api/v1/auth/login", {
        email,
        password,
      });

      const accessToken = response.data.accessToken;

      if (!accessToken) {
        throw new Error("Access token missing from response");
      }

      sessionStorage.setItem("admin_token", accessToken);
      setToken(accessToken);
      setPassword("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_token");
    setToken("");
    setEmail("");
    setPassword("");
    setActivePage("Dashboard");
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-5">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-5">
            <div className="bg-blue-600 rounded-xl p-4">
              <Boxes className="text-white" size={32} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-slate-900">
            TechNova ERP
          </h1>
          <p className="text-center text-slate-500 mt-2 mb-8">
            Sign in to your workspace
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-3 border rounded-lg px-3">
                <Mail size={18} className="text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full py-3 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="flex items-center gap-3 border rounded-lg px-3">
                <LockKeyhole size={18} className="text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full py-3 outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className={`${sidebarOpen ? "block" : "hidden"} lg:block`}>
        <Sidebar
          activePage={activePage}
          onNavigate={(page) => {
            setActivePage(page);
            setSidebarOpen(false);
          }}
          onLogout={handleLogout}
        />
      </div>

      <div className="flex-1 min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu size={24} />
            </button>
            <h2 className="font-semibold text-slate-800">
              {activePage}
            </h2>
          </div>

          <span className="text-sm text-slate-500">
            TechNova ERP Admin Panel
          </span>
        </header>

        <main className="p-6 lg:p-8">




{activePage === "Dashboard" ? (
  <Dashboard />
) : activePage === "Products" ? (
  <Products />
) : activePage === "Inventory" ? (
  <Inventory />
) : activePage === "Suppliers" ? (
  <Suppliers />
) : activePage === "Customers" ? (
  <Customers />
    ) : activePage === "Purchase Orders" ? (
      <PurchaseOrders />
      ) : activePage === "Sales Orders" ? (
        <SalesOrders />
        ) : activePage === "Stock Movements" ? (
                    <StockMovements />
        ) : activePage === "Reports" ? (
          <Reports />

      ) : (
  <div className="rounded-2xl border border-slate-200 bg-white p-8">
    <h2 className="text-2xl font-bold text-slate-900">
      {activePage}
    </h2>
    <p className="mt-2 text-slate-500">
      This module will be connected soon.
    </p>
  </div>
)}


        </main>
      </div>
    </div>
  );
}
