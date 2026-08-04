import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { adminUser, checkingAuth } = useAuth();

  if (checkingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-950 text-canvas/60 font-body text-sm">
        Vérification de la session…
      </div>
    );
  }

  if (!adminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
