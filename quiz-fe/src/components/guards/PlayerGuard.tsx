import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function PlayerGuard() {
  const { token, role } = useAuthStore();

  if (!token || role !== "player") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
