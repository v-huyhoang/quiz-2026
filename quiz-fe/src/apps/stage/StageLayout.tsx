import { Outlet } from "react-router-dom";

export default function StageLayout() {
  return (
    <div className="min-h-screen bg-surface text-gray-900 relative">
      {/* Global Stage Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center pointer-events-none z-50">
        <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
          <span className="text-xs font-black uppercase tracking-widest text-gray-900">Live Stage</span>
        </div>
        {/* <div className="bg-primary px-4 py-2 rounded-xl shadow-md text-white">
          <span className="text-xs font-black uppercase tracking-widest">Round 01 / 03</span>
        </div> */}
      </div>
      
      <Outlet />
    </div>
  );
}
