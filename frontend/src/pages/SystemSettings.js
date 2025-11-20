import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Settings, Plus, X, Save } from "lucide-react";

export default function SystemSettings({ user, onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    default_interest_rate: 12,
    available_interest_rates: [8, 10, 12, 15, 18, 20]
  });
  const [newRate, setNewRate] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API}/config/system`);
      setConfig({
        default_interest_rate: response.data.default_interest_rate,
        available_interest_rates: response.data.available_interest_rates
      });
    } catch (error) {
      toast.error("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/config/system?admin_id=${user.id}`, config);
      toast.success("Configuración guardada exitosamente");
    } catch (error) {
      toast.error("Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRate = () => {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      toast.error("Ingresa una tasa válida");
      return;
    }
    if (config.available_interest_rates.includes(rate)) {
      toast.error("Esta tasa ya existe");
      return;
    }
    setConfig({
      ...config,
      available_interest_rates: [...config.available_interest_rates, rate].sort((a, b) => a - b)
    });
    setNewRate("");
  };

  const handleRemoveRate = (rate) => {
    if (config.available_interest_rates.length <= 1) {
      toast.error("Debe haber al menos una tasa disponible");
      return;
    }
    setConfig({
      ...config,
      available_interest_rates: config.available_interest_rates.filter(r => r !== rate)
    });
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
              <Settings className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Panel de Control</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Configuración de Tasas de Interés</CardTitle>
            <CardDescription>
              Configura la tasa por defecto y las opciones disponibles para los préstamos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Default Rate */}
            <div className="space-y-2">
              <Label htmlFor="default_rate">Tasa de Interés Por Defecto (%)</Label>
              <Input
                id="default_rate"
                type="number"
                step="0.1"
                value={config.default_interest_rate}
                onChange={(e) => setConfig({ ...config, default_interest_rate: parseFloat(e.target.value) })}
                data-testid="default-rate-input"
                className="max-w-xs"
              />
              <p className="text-sm text-gray-500">
                Esta tasa se aplicará automáticamente a nuevas solicitudes de préstamo
              </p>
            </div>

            {/* Available Rates */}
            <div className="space-y-4">
              <Label>Tasas de Interés Disponibles (%)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {config.available_interest_rates.map((rate) => (
                  <div
                    key={rate}
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    data-testid={`rate-${rate}`}
                  >
                    <span className="font-semibold text-blue-900">{rate}%</span>
                    <button
                      onClick={() => handleRemoveRate(rate)}
                      className="text-red-500 hover:text-red-700"
                      data-testid={`remove-rate-${rate}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Rate */}
              <div className="flex space-x-2 max-w-md">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Nueva tasa (%)"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  data-testid="new-rate-input"
                />
                <Button
                  onClick={handleAddRate}
                  variant="outline"
                  data-testid="add-rate-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Estas tasas estarán disponibles al aprobar préstamos según el historial crediticio
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700"
                data-testid="save-config-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• La tasa por defecto se asignará automáticamente a nuevas solicitudes</li>
              <li>• Al aprobar un préstamo, podrás seleccionar cualquier tasa disponible</li>
              <li>• Si cambias la tasa al aprobar, el cliente recibirá una notificación para aceptar o rechazar</li>
              <li>• Las tasas más bajas se recomiendan para clientes con buen historial crediticio</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
