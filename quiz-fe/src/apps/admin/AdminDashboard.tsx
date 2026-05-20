import { motion } from "motion/react";
import { Layers, Users, HelpCircle, Trophy } from "lucide-react";

// Mock stats cho Overview (Phase 5)
const MOCK_STATS = [
  { label: "Phòng đang hoạt động", value: "1", icon: <Layers size={20} />, color: "bg-blue-50 text-blue-500" },
  { label: "Teams đã đăng ký", value: "8", icon: <Users size={20} />, color: "bg-green-50 text-green-600" },
  { label: "Câu hỏi trong bank", value: "24", icon: <HelpCircle size={20} />, color: "bg-orange-50 text-orange-500" },
  { label: "Games hoàn thành", value: "3", icon: <Trophy size={20} />, color: "bg-purple-50 text-purple-500" },
];

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-8 w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-black text-gray-900 mb-1">Dashboard</h2>
        <p className="text-gray-500 text-sm">Tổng quan hệ thống Quiz Stack</p>
      </motion.div>

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
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
      >
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
      </motion.div>
    </div>
  );
}
