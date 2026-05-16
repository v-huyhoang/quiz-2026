import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function AdminGuard() {
  const { token, role } = useAuthStore();

  if (!token || role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
