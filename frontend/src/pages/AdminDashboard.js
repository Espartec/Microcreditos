import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Clock, Users, LogOut, Calendar, CheckCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [approvalData, setApprovalData] = useState({
    lender_id: "",
    start_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, loansRes, usersRes] = await Promise.all([
        axios.get(`${API}/stats/dashboard?user_id=${user.id}&role=${user.role}`),
        axios.get(`${API}/loans`),
        axios.get(`${API}/users?role=lender`)
      ]);
      setStats(statsRes.data);
      setLoans(loansRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLoan = async () => {
    if (!approvalData.lender_id) {
      toast.error("Selecciona un prestamista");
      return;
    }

    try {
      await axios.post(`${API}/loans/${selectedLoan.id}/approve`, {
        loan_id: selectedLoan.id,
        lender_id: approvalData.lender_id,
        start_date: new Date(approvalData.start_date).toISOString()
      });
      toast.success("Préstamo aprobado exitosamente");
      setApprovalDialog(false);
      setSelectedLoan(null);
      setApprovalData({ lender_id: "", start_date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al aprobar préstamo");
    }
  };

  const handleRejectLoan = async (loanId) => {
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
                          onClick={() => {
                            setSelectedLoan(loan);
                            setApprovalDialog(true);
                          }}
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

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent data-testid="approval-dialog">
          <DialogHeader>
            <DialogTitle>Aprobar Préstamo</DialogTitle>
            <DialogDescription>
              Selecciona el prestamista y la fecha de inicio
            </DialogDescription>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Cliente: <span className="font-semibold">{selectedLoan.client_name}</span></p>
                <p className="text-sm text-gray-600">Monto: <span className="font-semibold">${selectedLoan.amount.toLocaleString()}</span></p>
              </div>
              <div className="space-y-2">
                <Label>Prestamista</Label>
                <Select
                  value={approvalData.lender_id}
                  onValueChange={(value) => setApprovalData({ ...approvalData, lender_id: value })}
                >
                  <SelectTrigger data-testid="lender-select">
                    <SelectValue placeholder="Selecciona prestamista" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id} data-testid={`lender-option-${u.id}`}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <Input
                  type="date"
                  value={approvalData.start_date}
                  onChange={(e) => setApprovalData({ ...approvalData, start_date: e.target.value })}
                  data-testid="start-date-input"
                />
              </div>
              <Button
                onClick={handleApproveLoan}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                data-testid="confirm-approve-btn"
              >
                Confirmar Aprobación
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
