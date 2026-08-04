import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
// import ProtectedRoute from "./components/ProtectedRoute";
import ClientChat from "./pages/ClientChat";
// import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
     <AuthProvider>
        <Routes>
          <Route path="/" element={<ClientChat />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          /> */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
