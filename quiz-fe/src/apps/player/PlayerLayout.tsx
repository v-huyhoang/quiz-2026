import { Outlet } from "react-router-dom";

export default function PlayerLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Outlet />
    </div>
  );
}
