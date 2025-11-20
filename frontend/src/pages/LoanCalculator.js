import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DollarSign, ArrowLeft, Calculator } from "lucide-react";

export default function LoanCalculator({ user, onLogout }) {
  const navigate = useNavigate();
  const [systemConfig, setSystemConfig] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    term_months: ""
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const isAuthenticated = !!user;

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API}/config/system`);
      setSystemConfig(response.data);
    } catch (error) {
      toast.error("Error al cargar configuración");
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/loans/calculate`, {
        amount: parseFloat(formData.amount),
        interest_rate: systemConfig.default_interest_rate,
        term_months: parseInt(formData.term_months)
      });
      setResult(response.data);
      toast.success("Cálculo completado");
    } catch (error) {
      toast.error("Error al calcular");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
              data-testid="back-to-dashboard-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center space-x-2">
              <Calculator className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Calculadora de Préstamos</span>
            </div>
          </div>
          {!isAuthenticated && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
                data-testid="header-login-btn"
              >
                Iniciar Sesión
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/register")}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="header-register-btn"
              >
                Registrarse
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calculator Form */}
          <Card className="glass-card" data-testid="calculator-card">
            <CardHeader>
              <CardTitle>Calcular Préstamo</CardTitle>
              <CardDescription>
                Ingresa los datos para calcular las cuotas mensuales
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingConfig ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <form onSubmit={handleCalculate} className="space-y-4">
                  {systemConfig && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900">
                        <strong>Tasa de Interés:</strong> {systemConfig.default_interest_rate}% anual
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Esta es la tasa estándar del sistema
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto del Préstamo</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="10000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      data-testid="calc-amount-input"
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
                    data-testid="calc-term-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                  data-testid="calculate-btn"
                >
                  {loading ? "Calculando..." : "Calcular"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card className="glass-card" data-testid="results-card">
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Cuota Mensual</p>
                    <p className="text-2xl font-bold text-blue-600" data-testid="result-monthly-payment">
                      ${result.monthly_payment}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total a Pagar</p>
                    <p className="text-2xl font-bold text-emerald-600" data-testid="result-total-amount">
                      ${result.total_amount}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total de Intereses</p>
                  <p className="text-2xl font-bold text-amber-600" data-testid="result-total-interest">
                    ${result.total_interest}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Tabla de Amortización</h3>
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">#</th>
                          <th className="px-4 py-2 text-right">Cuota</th>
                          <th className="px-4 py-2 text-right">Capital</th>
                          <th className="px-4 py-2 text-right">Interés</th>
                          <th className="px-4 py-2 text-right">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.schedule.map((row) => (
                          <tr key={row.payment_number} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2">{row.payment_number}</td>
                            <td className="px-4 py-2 text-right">${row.payment}</td>
                            <td className="px-4 py-2 text-right">${row.principal}</td>
                            <td className="px-4 py-2 text-right">${row.interest}</td>
                            <td className="px-4 py-2 text-right font-semibold">${row.balance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!result && (
            <Card className="glass-card">
              <CardContent className="py-20 text-center">
                <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Completa el formulario para ver los resultados</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
