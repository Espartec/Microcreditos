import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

export default function Register({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    cedula: "",
    phone: "",
    address: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Todos los registros son clientes por defecto
      const registerData = { ...formData, role: "client" };
      const response = await axios.post(`${API}/auth/register`, registerData);
      onLogin(response.data.access_token, response.data.user);
      toast.success("¡Cuenta creada exitosamente!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <DollarSign className="w-10 h-10 text-blue-600 mr-2" />
          <span className="text-3xl font-bold text-gray-900">Prestamo+</span>
        </div>

        <Card className="glass-card border-0 shadow-2xl" data-testid="register-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Crear Cuenta</CardTitle>
            <CardDescription className="text-center">
              Completa tus datos para registrarte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="register-name-input"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="register-email-input"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  data-testid="register-password-input"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cedula">Número de Cédula</Label>
                <Input
                  id="cedula"
                  placeholder="1234567890"
                  value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  data-testid="register-cedula-input"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (Opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="register-phone-input"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección (Opcional)</Label>
                <Input
                  id="address"
                  placeholder="Calle 123, Ciudad"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  data-testid="register-address-input"
                  className="rounded-lg"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-6"
                disabled={loading}
                data-testid="register-submit-btn"
              >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-blue-600 font-semibold hover:underline"
                  data-testid="register-to-login-link"
                >
                  Inicia sesión
                </button>
              </p>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => navigate("/")}
                className="text-sm text-gray-500 hover:text-gray-700"
                data-testid="register-back-to-home-link"
              >
                ← Volver al inicio
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
