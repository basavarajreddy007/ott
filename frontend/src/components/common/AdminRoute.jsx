import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "./Spinner";

export default function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner fullScreen />;
  if (!user || user.role !== "admin") return <Navigate to="/" replace />;

  return <Outlet />;
}
