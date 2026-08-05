import { useAuth } from "../context/AuthContext";

// ⚠️ Protection désactivée volontairement : /admin est accessible sans connexion.
// Pour la réactiver plus tard, décommente le bloc ci-dessous.
export default function ProtectedRoute({ children }) {
  // const { adminUser, checkingAuth } = useAuth();
  //
  // if (checkingAuth) {
  //   return (
  //     <div className="flex h-screen items-center justify-center bg-ink-950 text-canvas/60 font-body text-sm">
  //       Vérification de la session…
  //     </div>
  //   );
  // }
  //
  // if (!adminUser) {
  //   return <Navigate to="/admin/login" replace />;
  // }

  return children;
}
