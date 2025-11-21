import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Clock, CheckCircle, LogOut, Calculator, FileText, Bell } from "lucide-react";

export default function ClientDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [proposalsCount, setProposalsCount] = useState(0);
  const [systemConfig, setSystemConfig] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    term_months: "",
    purpose: "",
    payment_frequency: "monthly"  // Valor por defecto
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, loansRes, proposalsRes, configRes] = await Promise.all([
        axios.get(`${API}/stats/dashboard?user_id=${user.id}&role=${user.role}`),
        axios.get(`${API}/loans?client_id=${user.id}`),
        axios.get(`${API}/proposals/count?client_id=${user.id}`),
        axios.get(`${API}/config/system`)
      ]);
      setStats(statsRes.data);
      setLoans(loansRes.data);
      setProposalsCount(proposalsRes.data.count);
      setSystemConfig(configRes.data);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    try {
      // Usar la tasa de interés por defecto del sistema
      const loanData = {
        ...formData,
        interest_rate: systemConfig.default_interest_rate
      };
      
      await axios.post(
        `${API}/loans?client_id=${user.id}&client_name=${encodeURIComponent(user.name)}`,
        loanData
      );
      toast.success("Solicitud de préstamo creada exitosamente");
      setDialogOpen(false);
      setFormData({ amount: "", term_months: "", purpose: "", payment_frequency: "monthly" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear solicitud");
    }
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
              onClick={() => navigate("/calculator")}
              data-testid="nav-calculator-btn"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculadora
            </Button>
            {proposalsCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/proposals")}
                className="relative bg-amber-50 text-amber-700 hover:bg-amber-100"
                data-testid="nav-proposals-btn"
              >
                <Bell className="w-4 h-4 mr-2" />
                Propuestas
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {proposalsCount}
                </span>
              </Button>
            )}
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

          <div className="stat-card" data-testid="stat-pending-loans">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Pendientes</h3>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.pending_loans || 0}</p>
          </div>

          <div className="stat-card" data-testid="stat-total-debt">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Deuda Total</h3>
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${stats?.remaining || 0}</p>
          </div>

          <div className="stat-card" data-testid="stat-total-paid">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Pagado</h3>
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${stats?.total_paid || 0}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mis Préstamos</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="create-loan-btn">
                + Solicitar Préstamo
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="create-loan-dialog">
              <DialogHeader>
                <DialogTitle>Nueva Solicitud de Préstamo</DialogTitle>
                <DialogDescription>
                  Completa los datos para solicitar un nuevo préstamo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateLoan} className="space-y-4">
                {systemConfig && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      <strong>Tasa de Interés:</strong> {systemConfig.default_interest_rate}% anual
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      El administrador podrá ajustar esta tasa según tu historial crediticio
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="10000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    data-testid="loan-amount-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term_months">Plazo (meses)</Label>
                  <Input
                    id="term_months"
                    type="number"
                    placeholder="12"
                    value={formData.term_months}
                    onChange={(e) => setFormData({ ...formData, term_months: e.target.value })}
                    required
                    data-testid="loan-term-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment_frequency">Forma de Pago</Label>
                  <Select 
                    value={formData.payment_frequency} 
                    onValueChange={(val) => setFormData({ ...formData, payment_frequency: val })}
                  >
                    <SelectTrigger data-testid="loan-frequency-select">
                      <SelectValue placeholder="Selecciona frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      {systemConfig?.payment_frequencies
                        ?.filter(freq => freq.active)
                        .map((freq) => (
                          <SelectItem key={freq.id} value={freq.id}>
                            {freq.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purpose">Propósito (Opcional)</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Describe el propósito del préstamo..."
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    data-testid="loan-purpose-input"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" data-testid="submit-loan-btn">
                  Enviar Solicitud
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Loans List */}
        <div className="space-y-4">
          {loans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tienes préstamos aún</p>
                <Button
                  onClick={() => setDialogOpen(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                  data-testid="empty-state-create-loan-btn"
                >
                  Solicitar Primer Préstamo
                </Button>
              </CardContent>
            </Card>
          ) : (
            loans.map((loan) => (
              <Card
                key={loan.id}
                className="loan-card"
                onClick={() => navigate(`/loan/${loan.id}`)}
                data-testid={`loan-card-${loan.id}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">${loan.amount.toLocaleString()}</CardTitle>
                      <CardDescription className="mt-1">
                        {loan.purpose || "Sin descripción"}
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
                      <p className="text-gray-600">Cuota Mensual</p>
                      <p className="font-semibold text-gray-900">${loan.monthly_payment}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Plazo</p>
                      <p className="font-semibold text-gray-900">{loan.term_months} meses</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tasa</p>
                      <p className="font-semibold text-gray-900">{loan.interest_rate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total</p>
                      <p className="font-semibold text-gray-900">${loan.total_amount.toLocaleString()}</p>
                    </div>
                  </div>
                  {loan.lender_name && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">Prestamista: <span className="font-semibold">{loan.lender_name}</span></p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
