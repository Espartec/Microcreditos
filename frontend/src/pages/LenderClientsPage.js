import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Users, RefreshCw, AlertTriangle, User } from "lucide-react";

export default function LenderClientsPage({ user, onLogout }) {
  const { lenderId } = useParams();
  const navigate = useNavigate();
  const [lenderInfo, setLenderInfo] = useState(null);
  const [assignedData, setAssignedData] = useState(null);
  const [availableLenders, setAvailableLenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reassignDialog, setReassignDialog] = useState(false);
  const [selectedNewLender, setSelectedNewLender] = useState("");
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, [lenderId]);

  const fetchData = async () => {
    try {
      const [lenderRes, assignedRes, lendersRes] = await Promise.all([
        axios.get(`${API}/users/${lenderId}`),
        axios.get(`${API}/users/${lenderId}/assigned-loans`),
        axios.get(`${API}/users?role=lender`)
      ]);
      
      setLenderInfo(lenderRes.data);
      setAssignedData(assignedRes.data);
      // Filtrar para excluir el prestamista actual
      setAvailableLenders(lendersRes.data.filter(l => l.id !== lenderId));
    } catch (error) {
      toast.error("Error al cargar información del prestamista");
    } finally {
      setLoading(false);
    }
  };

  const handleReassignClients = async () => {
    if (!selectedNewLender) {
      toast.error("Selecciona el nuevo prestamista");
      return;
    }

    setReassigning(true);
    try {
      const response = await axios.post(
        `${API}/users/${lenderId}/reassign-clients?new_lender_id=${selectedNewLender}&admin_id=${user.id}`
      );
      toast.success(response.data.message);
      setReassignDialog(false);
      setSelectedNewLender("");
      fetchData(); // Actualizar datos
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al reasignar clientes");
    } finally {
      setReassigning(false);
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
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              data-testid="back-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Clientes Asignados</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Lender Info */}
        <Card className="glass-card mb-8" data-testid="lender-info-card">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">Prestamista: {lenderInfo?.name}</CardTitle>
                <CardDescription className="mt-2">{lenderInfo?.email}</CardDescription>
              </div>
              <div className="text-right">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Préstamos Activos: <span className="font-bold text-emerald-600">{assignedData?.total_active_loans || 0}</span></p>
                  <p className="text-sm text-gray-600">Solicitudes Pendientes: <span className="font-bold text-amber-600">{assignedData?.total_pending_loans || 0}</span></p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Action Button */}
        {assignedData?.clients_count > 0 && (
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Clientes Asignados ({assignedData.clients_count})
            </h2>
            <Button
              onClick={() => setReassignDialog(true)}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="reassign-clients-btn"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reasignar Todos los Clientes
            </Button>
          </div>
        )}

        {/* Clients List */}
        <div className="space-y-4">
          {assignedData?.clients_count === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Este prestamista no tiene clientes asignados</p>
                <p className="text-gray-500 text-sm mt-2">
                  No hay préstamos activos o pendientes asociados a este prestamista
                </p>
              </CardContent>
            </Card>
          ) : (
            assignedData?.clients?.map((clientData) => (
              <Card key={clientData.client.id} className="hover:shadow-md transition-shadow" data-testid={`client-card-${clientData.client.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{clientData.client.name}</CardTitle>
                      <CardDescription>{clientData.client.email}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/client/${clientData.client.id}`)}
                      data-testid={`view-client-${clientData.client.id}`}
                    >
                      Ver Perfil
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Préstamos Activos</p>
                      <p className="text-xl font-bold text-emerald-600">
                        {clientData.active_loans.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Solicitudes Pendientes</p>
                      <p className="text-xl font-bold text-amber-600">
                        {clientData.pending_loans.length}
                      </p>
                    </div>
                  </div>
                  
                  {clientData.active_loans.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Préstamos Activos:</h4>
                      <div className="space-y-1">
                        {clientData.active_loans.map((loan) => (
                          <div key={loan.id} className="text-xs text-gray-600">
                            ${loan.amount.toLocaleString()} - {loan.term_months} ({loan.payment_frequency_name?.toLowerCase() || 'mensual'}) - {loan.interest_rate}%
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Reassign Dialog */}
      <Dialog open={reassignDialog} onOpenChange={setReassignDialog}>
        <DialogContent data-testid="reassign-dialog">
          <DialogHeader>
            <div className="flex items-center space-x-2 text-orange-600">
              <AlertTriangle className="w-6 h-6" />
              <DialogTitle>Reasignar Todos los Clientes</DialogTitle>
            </div>
            <DialogDescription className="space-y-3 pt-4">
              <p>
                Estás a punto de reasignar <strong>todos los clientes</strong> de{" "}
                <strong>{lenderInfo?.name}</strong> a otro prestamista.
              </p>
              <p>
                Esto incluye <strong>{assignedData?.total_active_loans}</strong> préstamos activos y{" "}
                <strong>{assignedData?.total_pending_loans}</strong> solicitudes pendientes.
              </p>
              <p className="text-amber-600 font-medium">
                ⚠️ Esta acción no se puede deshacer.
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nuevo Prestamista</Label>
              <Select
                value={selectedNewLender}
                onValueChange={setSelectedNewLender}
              >
                <SelectTrigger data-testid="new-lender-select">
                  <SelectValue placeholder="Selecciona el nuevo prestamista" />
                </SelectTrigger>
                <SelectContent>
                  {availableLenders.map((lender) => (
                    <SelectItem key={lender.id} value={lender.id} data-testid={`new-lender-option-${lender.id}`}>
                      {lender.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={handleReassignClients}
              disabled={reassigning || !selectedNewLender}
              className="w-full bg-orange-600 hover:bg-orange-700"
              data-testid="confirm-reassign-btn"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {reassigning ? "Reasignando..." : "Confirmar Reasignación"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}