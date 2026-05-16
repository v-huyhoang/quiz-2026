import React, { useState } from "react";
import { Navbar } from "./parts/Navbar";
import { motion, AnimatePresence } from "motion/react";
import { LayoutDashboard, BookOpen, Layers, Play, Users, HelpCircle, Trophy } from "lucide-react";
import { AdminQuestion } from "./AdminQuestion";
import { AdminRoom } from "./AdminRoom";
import { useNavigate } from "react-router-dom";

type ActiveTab = "overview" | "questions" | "rooms";

// Mock stats cho Overview (Phase 5)
const MOCK_STATS = [
  { label: "Phòng đang hoạt động", value: "1", icon: <Layers size={20} />, color: "bg-blue-50 text-blue-500" },
  { label: "Teams đã đăng ký", value: "8", icon: <Users size={20} />, color: "bg-green-50 text-green-600" },
  { label: "Câu hỏi trong bank", value: "24", icon: <HelpCircle size={20} />, color: "bg-orange-50 text-orange-500" },
  { label: "Games hoàn thành", value: "3", icon: <Trophy size={20} />, color: "bg-purple-50 text-purple-500" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      <Navbar />

      <div className="flex flex-1 pt-20">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 p-6 hidden lg:flex flex-col gap-8">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              Command Center
            </p>
            <nav className="flex flex-col gap-2">
              <SidebarItem
                icon={<LayoutDashboard size={20} />}
                label="Overview"
                active={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
              />
              <SidebarItem
                icon={<BookOpen size={20} />}
                label="Question Bank"
                active={activeTab === "questions"}
                onClick={() => setActiveTab("questions")}
              />
              <SidebarItem
                icon={<Layers size={20} />}
                label="Room Config"
                active={activeTab === "rooms"}
                onClick={() => setActiveTab("rooms")}
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
              Game Control
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
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {activeTab === "overview" && <OverviewTab />}
                {activeTab === "questions" && <AdminQuestion />}
                {activeTab === "rooms" && <AdminRoom />}
              </motion.div>
            </AnimatePresence>
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

/** Overview tab — stats grid */
function OverviewTab() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">Dashboard</h2>
        <p className="text-gray-500 text-sm">Tổng quan hệ thống Quiz Stack</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-3xl font-black text-gray-900">{stat.value}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
          Hướng dẫn nhanh
        </h3>
        <ol className="flex flex-col gap-3">
          {[
            { step: "1", text: "Tạo phòng thi trong tab Room Config" },
            { step: "2", text: "Thêm câu hỏi trong Question Bank" },
            { step: "3", text: "Chia sẻ QR code cho các đội tham gia" },
            { step: "4", text: "Vào Game Control to bắt đầu trận đấu" },
          ].map((item) => (
            <li key={item.step} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                {item.step}
              </span>
              <p className="text-sm text-gray-600 font-medium">{item.text}</p>
            </li>
          ))}
        </ol>
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
