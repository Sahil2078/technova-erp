
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Truck,
  Users,
  ShoppingCart,
  ClipboardList,
  ChartNoAxesCombined,
  Boxes,
  LogOut,
    History,
} from "lucide-react";


const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Products", icon: Package },
  { name: "Inventory", icon: Warehouse },
  { name: "Suppliers", icon: Truck },
  { name: "Customers", icon: Users },
  { name: "Purchase Orders", icon: ClipboardList },
  { name: "Sales Orders", icon: ShoppingCart },
  { name: "Stock Movements", icon: History },
  { name: "Reports", icon: ChartNoAxesCombined },
];


export default function Sidebar({ activePage, onNavigate, onLogout }) {
  return (
    <aside className="w-64 shrink-0 min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
        <div className="bg-blue-600 p-2 rounded-xl">
          <Boxes size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg">TechNova ERP</h1>
          <p className="text-xs text-slate-400">Management System</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => onNavigate(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                activePage === item.name
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={19} />
              <span className="text-sm font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-slate-800"
        >
          <LogOut size={19} />
          Logout
        </button>
      </div>
    </aside>
  );
}
