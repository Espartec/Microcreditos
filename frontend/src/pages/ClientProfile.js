import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, User, Mail, Phone, MapPin } from "lucide-react";

export default function ClientProfile({ user, onLogout }) {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    try {
      const [clientRes, loansRes] = await Promise.all([
        axios.get(`${API}/users/${clientId}`),
        axios.get(`${API}/loans?client_id=${clientId}`)
      ]);
      setClient(clientRes.data);
      setLoans(loansRes.data);
    } catch (error) {
      toast.error("Error al cargar perfil del cliente");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cliente no encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            data-testid="back-to-dashboard-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Client Info */}
        <Card className="glass-card mb-8" data-testid="client-info-card">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl" data-testid="client-name">{client.name}</CardTitle>
                <CardDescription>Cliente</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold" data-testid="client-email">{client.email}</p>
                </div>
              </div>
              {client.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-semibold" data-testid="client-phone">{client.phone}</p>
                  </div>
                </div>
              )}
              {client.address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Dirección</p>
                    <p className="font-semibold" data-testid="client-address">{client.address}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loans */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Préstamos del Cliente</h2>
          <p className="text-gray-600">Total: {loans.length} préstamo(s)</p>
        </div>

        <div className="space-y-4">
          {loans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">Este cliente no tiene préstamos registrados</p>
              </CardContent>
            </Card>
          ) : (
            loans.map((loan) => (
              <Card
                key={loan.id}
                className="loan-card"
                onClick={() => navigate(`/loan/${loan.id}`)}
                data-testid={`client-loan-${loan.id}`}
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
