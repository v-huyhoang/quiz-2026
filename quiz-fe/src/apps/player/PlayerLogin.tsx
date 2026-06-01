import React from "react";
import { LogIn, Group, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import backgroundImage from "../../assets/background.png";

export default function PlayerLogin() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/player/waiting");
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
      {/* Background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-container/10 rounded-full blur-[120px]"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden relative z-10"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>

        <div className="p-8 flex flex-col gap-8">
          <div className="text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
              <LogIn size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-primary tracking-tighter">
              Quiz Stack
            </h1>
            <p className="text-[10px] font-bold text-gray-400 mt-2 tracking-widest uppercase">
              Enter the Arena
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Group size={12} /> Mã đội
              </label>
              <input
                type="text"
                placeholder="e.g. Neon Knights"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Key size={12} /> Mật khẩu
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <button
              type="submit"
              className="mt-4 w-full bg-primary text-white font-bold py-4 rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group"
            >
              <LogIn
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
              Kết nối
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
