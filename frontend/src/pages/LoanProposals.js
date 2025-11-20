import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Bell, CheckCircle, X, TrendingUp, TrendingDown } from "lucide-react";

export default function LoanProposals({ user, onLogout }) {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await axios.get(`${API}/proposals?client_id=${user.id}&status=pending`);
      setProposals(response.data);
    } catch (error) {
      toast.error("Error al cargar propuestas");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (proposal) => {
    setSelectedProposal(proposal);
    setDetailDialog(true);
  };

  const handleRespond = async (proposalId, accepted) => {
    setResponding(true);
    try {
      await axios.post(`${API}/proposals/${proposalId}/respond`, {
        proposal_id: proposalId,
        accepted: accepted
      });
      toast.success(accepted ? "Propuesta aceptada exitosamente" : "Propuesta rechazada");
      setDetailDialog(false);
      setSelectedProposal(null);
      fetchProposals();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al responder propuesta");
    } finally {
      setResponding(false);
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
              onClick={() => navigate("/dashboard")}
              data-testid="back-to-dashboard-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center space-x-2">
              <Bell className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Propuestas de Préstamo</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {proposals.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No tienes propuestas pendientes</p>
              <p className="text-gray-500 text-sm mt-2">
                Cuando un administrador modifique los términos de tu préstamo, aparecerán aquí
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Propuestas Pendientes</h2>
              <p className="text-gray-600">Revisa y responde a las modificaciones propuestas</p>
            </div>

            {proposals.map((proposal) => {
              const rateDiff = proposal.proposed_interest_rate - proposal.original_interest_rate;
              const isLower = rateDiff < 0;
              
              return (
                <Card
                  key={proposal.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewDetail(proposal)}
                  data-testid={`proposal-card-${proposal.id}`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">
                          Modificación de Tasa de Interés
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Préstamo con {proposal.lender_name}
                        </CardDescription>
                      </div>
                      <div className={`px-4 py-2 rounded-full font-semibold ${
                        isLower ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {isLower ? (
                          <div className="flex items-center space-x-1">
                            <TrendingDown className="w-4 h-4" />
                            <span>Mejor Oferta</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>Tasa Mayor</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Original */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-3 font-semibold">Términos Originales</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">Tasa de Interés</p>
                            <p className="text-lg font-bold text-gray-700">{proposal.original_interest_rate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Cuota Mensual</p>
                            <p className="text-lg font-bold text-gray-700">${proposal.original_monthly_payment}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total a Pagar</p>
                            <p className="text-lg font-bold text-gray-700">${proposal.original_total_amount}</p>
                          </div>
                        </div>
                      </div>

                      {/* Proposed */}
                      <div className={`p-4 rounded-lg ${isLower ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                        <p className="text-sm mb-3 font-semibold ${isLower ? 'text-emerald-700' : 'text-amber-700'}">
                          Términos Propuestos
                        </p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">Tasa de Interés</p>
                            <p className={`text-lg font-bold ${isLower ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {proposal.proposed_interest_rate}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Cuota Mensual</p>
                            <p className={`text-lg font-bold ${isLower ? 'text-emerald-700' : 'text-amber-700'}`}>
                              ${proposal.proposed_monthly_payment}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total a Pagar</p>
                            <p className={`text-lg font-bold ${isLower ? 'text-emerald-700' : 'text-amber-700'}`}>
                              ${proposal.proposed_total_amount}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {proposal.reason && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <strong>Razón:</strong> {proposal.reason}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 flex space-x-3">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRespond(proposal.id, true);
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        disabled={responding}
                        data-testid={`accept-proposal-${proposal.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aceptar
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRespond(proposal.id, false);
                        }}
                        variant="destructive"
                        className="flex-1"
                        disabled={responding}
                        data-testid={`reject-proposal-${proposal.id}`}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-2xl" data-testid="proposal-detail-dialog">
          <DialogHeader>
            <DialogTitle>Detalle de la Propuesta</DialogTitle>
            <DialogDescription>
              Revisa cuidadosamente los cambios antes de tomar una decisión
            </DialogDescription>
          </DialogHeader>
          {selectedProposal && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información</h3>
                <p className="text-sm text-blue-800">
                  El administrador ha propuesto una modificación en la tasa de interés de tu préstamo.
                  Si aceptas, el préstamo será activado con los nuevos términos. Si rechazas, el préstamo
                  permanecerá pendiente con los términos originales.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
