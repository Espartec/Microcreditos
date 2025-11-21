import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, DollarSign, Calendar, CheckCircle, Clock } from "lucide-react";

export default function LoanDetail({ user, onLogout }) {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, [loanId]);

  const fetchData = async () => {
    try {
      const [loanRes, schedulesRes, paymentsRes, paymentStatusRes] = await Promise.all([
        axios.get(`${API}/loans/${loanId}`),
        axios.get(`${API}/schedules?loan_id=${loanId}`),
        axios.get(`${API}/payments?loan_id=${loanId}`),
        axios.get(`${API}/loans/${loanId}/payment-status`)
      ]);
      setLoan(loanRes.data);
      setSchedules(schedulesRes.data);
      setPayments(paymentsRes.data);
      
      // Set default payment amount to next pending payment or remaining amount
      const nextPending = schedulesRes.data.find(s => s.status === "pending");
      if (nextPending) {
        setPaymentData({ ...paymentData, amount: nextPending.amount.toString() });
      } else if (paymentStatusRes.data.pending_amount > 0) {
        setPaymentData({ ...paymentData, amount: paymentStatusRes.data.pending_amount.toString() });
      }
    } catch (error) {
      toast.error("Error al cargar detalles del préstamo");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API}/payments?client_id=${loan.client_id}`,
        { loan_id: loanId, amount: parseFloat(paymentData.amount), notes: paymentData.notes }
      );
      toast.success("Pago registrado exitosamente");
      setPaymentDialog(false);
      setPaymentData({ amount: "", notes: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al registrar pago");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Préstamo no encontrado</p>
      </div>
    );
  }

  const paidSchedules = schedules.filter(s => s.status === "paid");
  const pendingSchedules = schedules.filter(s => s.status === "pending");
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = loan.total_amount - totalPaid;

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
        {/* Loan Info */}
        <Card className="glass-card mb-8" data-testid="loan-info-card">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl" data-testid="loan-amount">${loan.amount.toLocaleString()}</CardTitle>
                <CardDescription className="mt-2">
                  {loan.purpose || "Sin descripción"}
                </CardDescription>
              </div>
              <span className={`status-badge status-${loan.status} text-base`} data-testid="loan-status">
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
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cliente</p>
                <p className="font-semibold text-lg" data-testid="loan-client">{loan.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  Cuota {loan.payment_frequency_name || 'Mensual'}
                </p>
                <p className="font-semibold text-lg">${loan.monthly_payment}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Plazo</p>
                <p className="font-semibold text-lg">
                  {loan.term_months} ({loan.payment_frequency_name?.toLowerCase() || 'mensual'})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Tasa de Interés</p>
                <p className="font-semibold text-lg">{loan.interest_rate}%</p>
              </div>
            </div>
            {loan.lender_name && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">Prestamista: <span className="font-semibold text-lg">{loan.lender_name}</span></p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total del Préstamo</h3>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900" data-testid="total-amount">${loan.total_amount.toLocaleString()}</p>
          </Card>

          <Card className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Pagado</h3>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600" data-testid="total-paid">${totalPaid.toFixed(2)}</p>
          </Card>

          <Card className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Saldo Pendiente</h3>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600" data-testid="remaining-amount">${remaining.toFixed(2)}</p>
          </Card>
        </div>

        {/* Payment Button */}
        {loan.status === "active" && (user.role === "admin" || (user.role === "lender" && user.id === loan.lender_id)) && (
          <div className="mb-8 text-center">
            <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 px-8 py-6 text-lg" data-testid="register-payment-btn">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Registrar Pago
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="payment-dialog">
                <DialogHeader>
                  <DialogTitle>Registrar Pago</DialogTitle>
                  <DialogDescription>
                    Ingresa el monto del pago realizado
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePayment} className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      💡 <strong>Información sobre pagos:</strong>
                    </p>
                    <ul className="text-xs text-blue-800 mt-1 list-disc ml-4 space-y-1">
                      <li>Puedes pagar el monto exacto, menor o mayor a la cuota</li>
                      <li>Los excedentes se aplicarán a futuras cuotas</li>
                      <li>Los pagos parciales actualizarán el cronograma automáticamente</li>
                      <li>Puedes pagar la totalidad del préstamo en una sola cuota</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      required
                      data-testid="payment-amount-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas (Opcional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Notas adicionales..."
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                      data-testid="payment-notes-input"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" data-testid="submit-payment-btn">
                    Confirmar Pago
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Payment Schedule */}
        <Card className="mb-8" data-testid="schedule-card">
          <CardHeader>
            <CardTitle>Cronograma de Pagos</CardTitle>
            <CardDescription>
              {paidSchedules.length} de {schedules.length} cuotas pagadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className={`p-4 rounded-lg border-2 flex justify-between items-center ${
                    schedule.status === "paid" ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"
                  }`}
                  data-testid={`schedule-${schedule.payment_number}`}
                >
                  <div className="flex items-center space-x-4">
                    {schedule.status === "paid" ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-gray-400" />
                    )}
                    <div>
                      <p className="font-semibold">Cuota #{schedule.payment_number}</p>
                      <p className="text-sm text-gray-600">
                        Vencimiento: {new Date(schedule.due_date).toLocaleDateString('es-ES')}
                      </p>
                      {schedule.paid_date && (
                        <p className="text-sm text-emerald-600">
                          Pagado: {new Date(schedule.paid_date).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">${schedule.amount}</p>
                    <span className={`status-badge status-${schedule.status} text-xs`}>
                      {schedule.status === "paid" ? "Pagado" : "Pendiente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        {payments.length > 0 && (
          <Card data-testid="payments-history-card">
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 bg-white rounded-lg border flex justify-between items-center"
                    data-testid={`payment-${payment.id}`}
                  >
                    <div>
                      <p className="font-semibold">Cuota #{payment.payment_number}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.payment_date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {payment.notes && (
                        <p className="text-sm text-gray-500 mt-1">{payment.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-emerald-600">${payment.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
