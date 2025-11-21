import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ClientDashboard from "@/pages/ClientDashboard";
import LenderDashboard from "@/pages/LenderDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import LoanCalculator from "@/pages/LoanCalculator";
import ClientProfile from "@/pages/ClientProfile";
import LoanDetail from "@/pages/LoanDetail";
import CollectionModule from "@/pages/CollectionModule";
import UserManagement from "@/pages/UserManagement";
import SystemSettings from "@/pages/SystemSettings";
import LoanProposals from "@/pages/LoanProposals";
import ExpensesPage from "@/pages/ExpensesPage";
import LenderClientsPage from "@/pages/LenderClientsPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export { API };

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Sesión cerrada exitosamente");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register onLogin={handleLogin} />} />
          
          <Route
            path="/dashboard"
            element={
              user ? (
                user.role === "client" ? (
                  <ClientDashboard user={user} onLogout={handleLogout} />
                ) : user.role === "lender" ? (
                  <LenderDashboard user={user} onLogout={handleLogout} />
                ) : (
                  <AdminDashboard user={user} onLogout={handleLogout} />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          
          <Route
            path="/calculator"
            element={<LoanCalculator user={user} onLogout={handleLogout} />}
          />
          
          <Route
            path="/client/:clientId"
            element={user ? <ClientProfile user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          
          <Route
            path="/loan/:loanId"
            element={user ? <LoanDetail user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          
          <Route
            path="/collections"
            element={
              user && (user.role === "admin" || user.role === "lender") ? (
                <CollectionModule user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          
          <Route
            path="/users"
            element={
              user && user.role === "admin" ? (
                <UserManagement user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          
          <Route
            path="/settings"
            element={
              user && user.role === "admin" ? (
                <SystemSettings user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          
          <Route
            path="/proposals"
            element={user ? <LoanProposals user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          
          <Route
            path="/lender/:lenderId/clients"
            element={
              user && user.role === "admin" ? (
                <LenderClientsPage user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          
          <Route
            path="/gastos"
            element={
              user && user.role === "admin" ? (
                <ExpensesPage user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
