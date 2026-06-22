import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronDown, Gamepad2, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "../../../store/authStore";
// TODO Phase 5: uncomment when BE is ready

export function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      // TODO Phase 5: call logout API to invalidate server token
      // await adminLogout();
    } catch {
      // clear local state even if server errors
    } finally {
      clearAuth();
      navigate("/admin/login");
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Gamepad2 size={16} className="text-white" />
        </div>
        <h1 className="text-xl font-black text-primary tracking-tight">
          Quiz Stack
        </h1>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-1 rounded">
          ADMIN
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Avatar dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm shadow-sm">
              A
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-black text-gray-900">
                  Admin
                </p>
                <p className="text-xs text-gray-400 truncate">
                  quiz@admin.com
                </p>
              </div>

              {/* Change-password */}
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/admin/change-password");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Lock className="w-4 h-4" />
                Đổi mật khẩu
              </button>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
