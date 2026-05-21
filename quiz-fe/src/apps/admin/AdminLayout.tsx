import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "./parts/Navbar";
import { LayoutDashboard, BookOpen, Layers, Play } from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col text-gray-900">
      <Navbar />

      <div className="flex flex-1 pt-20">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 p-6 hidden lg:flex flex-col gap-8">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              Trung tâm điều khiển
            </p>
            <nav className="flex flex-col gap-2">
              <SidebarItem
                icon={<LayoutDashboard size={20} />}
                label="Tổng quan"
                active={location.pathname === "/admin/"}
                onClick={() => navigate("/admin/")}
              />
              <SidebarItem
                icon={<BookOpen size={20} />}
                label="Ngân hàng câu hỏi"
                active={location.pathname === "/admin/question"}
                onClick={() => navigate("/admin/question")}
              />
              <SidebarItem
                icon={<Layers size={20} />}
                label="Quản lý phòng"
                active={location.pathname === "/admin/rooms"}
                onClick={() => navigate("/admin/rooms")}
              />
            </nav>
          </div>

          {/* Quick launch */}
          <div className="mt-auto flex flex-col gap-3">
            <button
              onClick={() => navigate("/admin/game-control")}
              className="flex items-center gap-2 w-full bg-primary text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Play size={16} />
              Điều khiển trò chơi
            </button>

            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
                Server Status
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-700">ONLINE</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  );
}

function SidebarItem({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
        active
          ? "bg-primary text-white shadow-lg shadow-primary/20"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
