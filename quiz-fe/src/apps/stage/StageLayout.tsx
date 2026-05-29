import { Outlet } from "react-router-dom";

export default function StageLayout() {
  return (
    <div className="min-h-screen bg-surface text-gray-900 relative">
      <Outlet />
    </div>
  );
}
