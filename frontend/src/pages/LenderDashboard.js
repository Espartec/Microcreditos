import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DollarSign, TrendingUp, CheckCircle, LogOut, Calendar, Search } from "lucide-react";

export default function LenderDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterLoans();
  }, [searchTerm, loans]);

  const fetchData = async () => {
    try {
      const [statsRes, loansRes] = await Promise.all([
        axios.get(`${API}/stats/dashboard?user_id=${user.id}&role=${user.role}`),
        axios.get(`${API}/loans?lender_id=${user.id}`)
      ]);
      setStats(statsRes.data);
      setLoans(loansRes.data);
      setFilteredLoans(loansRes.data);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const filterLoans = () => {
    if (!searchTerm.trim()) {
      setFilteredLoans(loans);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = loans.filter(loan => 
      loan.client_name?.toLowerCase().includes(term) ||
      loan.loan_number?.toLowerCase().includes(term) ||
      loan.amount?.toString().includes(term) ||
      loan.status?.toLowerCase().includes(term)
    );
    
    setFilteredLoans(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Prestamo+</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600" data-testid="user-name-display">Hola, {user.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/collections")}
              data-testid="nav-collections-btn"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Cobros
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card" data-testid="stat-active-loans">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Préstamos Activos</h3>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.active_loans || 0}</p>
          </div>

          <div className="stat-card" data-testid="stat-completed-loans">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Completados</h3>
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.completed_loans || 0}</p>
          </div>

          <div className="stat-card" data-testid="stat-total-lent">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Prestado</h3>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${stats?.total_lent || 0}</p>
          </div>

          <div className="stat-card" data-testid="stat-expected-return">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Retorno Esperado</h3>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${stats?.total_expected || 0}</p>
          </div>
        </div>

        {/* Loans List */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Préstamos Otorgados ({filteredLoans.length})
            </h2>
          </div>
          
          {/* Buscador */}
          {loans.length > 0 && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por cliente, número de crédito, monto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          {loans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">No has otorgado préstamos aún</p>
              </CardContent>
            </Card>
          ) : filteredLoans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">No se encontraron préstamos con "{searchTerm}"</p>
              </CardContent>
            </Card>
          ) : (
            filteredLoans.map((loan) => (
              <Card
                key={loan.id}
                className="loan-card"
                onClick={() => navigate(`/loan/${loan.id}`)}
                data-testid={`loan-card-${loan.id}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <CardTitle className="text-xl">${loan.amount.toLocaleString()}</CardTitle>
                        {loan.loan_number && (
                          <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            #{loan.loan_number}
                          </span>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        Cliente: {loan.client_name}
                      </CardDescription>
                    </div>
                    <span className={`status-badge status-${loan.status}`} data-testid={`loan-status-${loan.id}`}>
                      {loan.status === "pending" && "Pendiente"}
                      {loan.status === "approved" && "Aprobado"}
                      {loan.status === "active" && "Activo"}
                      {loan.status === "completed" && "Completado"}
                      {loan.status === "rejected" && "Rechazado"}
                      {loan.status === "defaulted" && "Incumplido"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">
                        Cuota {loan.payment_frequency_name || 'Mensual'}
                      </p>
                      <p className="font-semibold text-gray-900">${loan.monthly_payment}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Plazo</p>
                      <p className="font-semibold text-gray-900">
                        {loan.term_months} ({loan.payment_frequency_name?.toLowerCase() || 'mensual'})
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tasa</p>
                      <p className="font-semibold text-gray-900">{loan.interest_rate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total a Recibir</p>
                      <p className="font-semibold text-gray-900">${loan.total_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
