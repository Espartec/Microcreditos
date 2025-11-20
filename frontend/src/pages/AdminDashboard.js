import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Clock, Users, LogOut, Calendar, CheckCircle, X, Settings, UserCog, LayoutDashboard, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loans, setLoans] = useState([]);
  const [lenders, setLenders] = useState([]);
  const [systemConfig, setSystemConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proposalDialog, setProposalDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [proposalData, setProposalData] = useState({
    lender_id: "",
    proposed_interest_rate: "",
    reason: "",
    start_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, loansRes, lendersRes, configRes] = await Promise.all([
        axios.get(`${API}/stats/dashboard?user_id=${user.id}&role=${user.role}`),
        axios.get(`${API}/loans`),
        axios.get(`${API}/users?role=lender`),
        axios.get(`${API}/config/system`)
      ]);
      setStats(statsRes.data);
      setLoans(loansRes.data);
      setLenders(lendersRes.data);
      setSystemConfig(configRes.data);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProposal = (loan) => {
    setSelectedLoan(loan);
    setProposalData({
      lender_id: "",
      proposed_interest_rate: systemConfig?.default_interest_rate || loan.interest_rate,
      reason: "",
      start_date: new Date().toISOString().split('T')[0]
    });
    setProposalDialog(true);
  };

  const handleCreateProposal = async () => {
    if (!proposalData.lender_id) {
      toast.error("Selecciona un prestamista");
      return;
    }

    try {
      // Si la tasa es diferente a la original, crear propuesta
      if (parseFloat(proposalData.proposed_interest_rate) !== selectedLoan.interest_rate) {
        await axios.post(`${API}/loans/${selectedLoan.id}/propose`, {
          loan_id: selectedLoan.id,
          lender_id: proposalData.lender_id,
          proposed_interest_rate: parseFloat(proposalData.proposed_interest_rate),
          reason: proposalData.reason,
          start_date: new Date(proposalData.start_date).toISOString()
        });
        toast.success("Propuesta enviada al cliente para aprobación");
      } else {
        // Si la tasa es igual, aprobar directamente
        await axios.post(`${API}/loans/${selectedLoan.id}/approve`, {
          loan_id: selectedLoan.id,
          lender_id: proposalData.lender_id,
          start_date: new Date(proposalData.start_date).toISOString()
        });
        toast.success("Préstamo aprobado exitosamente");
      }
      setProposalDialog(false);
      setSelectedLoan(null);
      setProposalData({
        lender_id: "",
        proposed_interest_rate: "",
        reason: "",
        start_date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al procesar solicitud");
    }
  };

  const handleRejectLoan = async (loanId) => {
    if (!window.confirm("¿Estás seguro de rechazar este préstamo?")) {
      return;
    }

    try {
      await axios.post(`${API}/loans/${loanId}/reject`);
      toast.success("Préstamo rechazado");
      fetchData();
    } catch (error) {
      toast.error("Error al rechazar préstamo");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingLoans = loans.filter(l => l.status === "pending");
  const activeLoans = loans.filter(l => l.status === "active");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Prestamo+ Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600" data-testid="user-name-display">Hola, {user.name}</span>
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
          
          {/* Navigation Menu */}
          <div className="flex space-x-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="bg-blue-50 text-blue-700"
              data-testid="nav-dashboard-btn"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/users")}
              data-testid="nav-users-btn"
            >
              <UserCog className="w-4 h-4 mr-2" />
              Gestión de Usuarios
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/settings")}
              data-testid="nav-settings-btn"
            >
              <Settings className="w-4 h-4 mr-2" />
              Panel de Control
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/collections")}
              data-testid="nav-collections-btn"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Módulo de Cobros
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="stat-card" data-testid="stat-total-loans">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Préstamos</h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.total_loans || 0}</p>
          </div>

          <div className="stat-card" data-testid="stat-pending-loans">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Pendientes</h3>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.pending_loans || 0}</p>
          </div>

          <div className="stat-card" data-testid="stat-active-loans">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Activos</h3>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.active_loans || 0}</p>
          </div>

          <div className="stat-card" data-testid="stat-total-users">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Usuarios</h3>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.total_users || 0}</p>
          </div>

          <div className="stat-card" data-testid="stat-total-volume">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Volumen Total</h3>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${stats?.total_volume || 0}</p>
          </div>
        </div>

        {/* Pending Loans */}
        {pendingLoans.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Solicitudes Pendientes</h2>
            <div className="space-y-4">
              {pendingLoans.map((loan) => (
                <Card key={loan.id} className="border-amber-200 bg-amber-50/50" data-testid={`pending-loan-${loan.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">${loan.amount.toLocaleString()}</CardTitle>
                        <CardDescription className="mt-1">
                          Cliente: {loan.client_name}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleOpenProposal(loan)}
                          data-testid={`approve-loan-${loan.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectLoan(loan.id)}
                          data-testid={`reject-loan-${loan.id}`}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
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
                    {loan.purpose && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-600">Propósito: {loan.purpose}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active Loans */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Préstamos Activos</h2>
        </div>

        <div className="space-y-4">
          {activeLoans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">No hay préstamos activos</p>
              </CardContent>
            </Card>
          ) : (
            activeLoans.map((loan) => (
              <Card
                key={loan.id}
                className="loan-card"
                onClick={() => navigate(`/client/${loan.client_id}`)}
                data-testid={`active-loan-${loan.id}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">${loan.amount.toLocaleString()}</CardTitle>
                      <CardDescription className="mt-1">
                        Cliente: {loan.client_name}
                      </CardDescription>
                    </div>
                    <span className="status-badge status-active">Activo</span>
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
                      <p className="text-gray-600">Prestamista</p>
                      <p className="font-semibold text-gray-900">{loan.lender_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total</p>
                      <p className="font-semibold text-gray-900">${loan.total_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Proposal Dialog */}
      <Dialog open={proposalDialog} onOpenChange={setProposalDialog}>
        <DialogContent className="max-w-2xl" data-testid="proposal-dialog">
          <DialogHeader>
            <DialogTitle>Aprobar Préstamo</DialogTitle>
            <DialogDescription>
              Selecciona prestamista y configura los términos del préstamo
            </DialogDescription>
          </DialogHeader>
          {selectedLoan && systemConfig && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Cliente: <span className="font-semibold">{selectedLoan.client_name}</span></p>
                <p className="text-sm text-gray-600">Monto: <span className="font-semibold">${selectedLoan.amount.toLocaleString()}</span></p>
                <p className="text-sm text-gray-600">Tasa Solicitada: <span className="font-semibold">{selectedLoan.interest_rate}%</span></p>
              </div>
              
              <div className="space-y-2">
                <Label>Prestamista</Label>
                <Select
                  value={proposalData.lender_id}
                  onValueChange={(value) => setProposalData({ ...proposalData, lender_id: value })}
                >
                  <SelectTrigger data-testid="lender-select">
                    <SelectValue placeholder="Selecciona prestamista" />
                  </SelectTrigger>
                  <SelectContent>
                    {lenders.map((l) => (
                      <SelectItem key={l.id} value={l.id} data-testid={`lender-option-${l.id}`}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tasa de Interés (%)</Label>
                <Select
                  value={proposalData.proposed_interest_rate.toString()}
                  onValueChange={(value) => setProposalData({ ...proposalData, proposed_interest_rate: value })}
                >
                  <SelectTrigger data-testid="interest-rate-select">
                    <SelectValue placeholder="Selecciona tasa" />
                  </SelectTrigger>
                  <SelectContent>
                    {systemConfig.available_interest_rates.map((rate) => (
                      <SelectItem key={rate} value={rate.toString()} data-testid={`rate-option-${rate}`}>
                        {rate}%
                        {rate === systemConfig.default_interest_rate && " (Por defecto)"}
                        {rate === selectedLoan.interest_rate && " (Original)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {proposalData.proposed_interest_rate && parseFloat(proposalData.proposed_interest_rate) !== selectedLoan.interest_rate && (
                  <p className="text-sm text-amber-600">
                    ⚠️ Has cambiado la tasa. Se enviará una propuesta al cliente para aprobación.
                  </p>
                )}
              </div>

              {proposalData.proposed_interest_rate && parseFloat(proposalData.proposed_interest_rate) !== selectedLoan.interest_rate && (
                <div className="space-y-2">
                  <Label>Razón del Cambio (Opcional)</Label>
                  <Textarea
                    placeholder="Ejemplo: Basado en el historial crediticio del cliente..."
                    value={proposalData.reason}
                    onChange={(e) => setProposalData({ ...proposalData, reason: e.target.value })}
                    data-testid="reason-input"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <Input
                  type="date"
                  value={proposalData.start_date}
                  onChange={(e) => setProposalData({ ...proposalData, start_date: e.target.value })}
                  data-testid="start-date-input"
                />
              </div>

              <Button
                onClick={handleCreateProposal}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                data-testid="confirm-approve-btn"
              >
                {proposalData.proposed_interest_rate && parseFloat(proposalData.proposed_interest_rate) !== selectedLoan.interest_rate
                  ? "Enviar Propuesta al Cliente"
                  : "Aprobar Préstamo"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Rate Dialog */}
      <Dialog open={editRateDialog} onOpenChange={setEditRateDialog}>
        <DialogContent data-testid="edit-rate-dialog">
          <DialogHeader>
            <DialogTitle>Editar Tasa de Interés</DialogTitle>
            <DialogDescription>
              Modifica la tasa de interés de esta solicitud
            </DialogDescription>
          </DialogHeader>
          {selectedLoan && systemConfig && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Cliente: <span className="font-semibold">{selectedLoan.client_name}</span></p>
                <p className="text-sm text-gray-600">Monto: <span className="font-semibold">${selectedLoan.amount.toLocaleString()}</span></p>
                <p className="text-sm text-gray-600">Tasa Actual: <span className="font-semibold">{selectedLoan.interest_rate}%</span></p>
              </div>
              
              <div className="space-y-2">
                <Label>Nueva Tasa de Interés (%)</Label>
                <Select
                  value={editRateData.new_rate}
                  onValueChange={(value) => setEditRateData({ new_rate: value })}
                >
                  <SelectTrigger data-testid="edit-interest-rate-select">
                    <SelectValue placeholder="Selecciona nueva tasa" />
                  </SelectTrigger>
                  <SelectContent>
                    {systemConfig.available_interest_rates.map((rate) => (
                      <SelectItem key={rate} value={rate.toString()} data-testid={`edit-rate-option-${rate}`}>
                        {rate}%
                        {rate === systemConfig.default_interest_rate && " (Por defecto)"}
                        {rate === selectedLoan.interest_rate && " (Actual)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  💡 <strong>Nota:</strong> Al cambiar la tasa aquí, se recalcularán automáticamente las cuotas mensuales y el total del préstamo.
                </p>
              </div>

              <Button
                onClick={handleSaveRateEdit}
                className="w-full bg-blue-600 hover:bg-blue-700"
                data-testid="save-rate-btn"
              >
                <Edit className="w-4 h-4 mr-2" />
                Guardar Nueva Tasa
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
