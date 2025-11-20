import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Shield, Users } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-8 h-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">Prestamo+</span>
        </div>
        <div className="flex space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            data-testid="nav-login-btn"
          >
            Iniciar Sesión
          </Button>
          <Button
            onClick={() => navigate("/register")}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="nav-register-btn"
          >
            Registrarse
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Gestiona tus Préstamos de
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Manera Inteligente
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Plataforma completa para administrar préstamos personales, microcréditos y seguimiento de pagos. 
            Todo en un solo lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/register")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-full"
              data-testid="hero-get-started-btn"
            >
              Comenzar Ahora
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/login")}
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg rounded-full"
              data-testid="hero-login-btn"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
          Características Principales
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="glass-card p-6 rounded-2xl hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Gestión Completa</h3>
            <p className="text-gray-600">
              Administra todos tus préstamos, solicitudes y pagos desde un solo panel.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Calculadora Inteligente</h3>
            <p className="text-gray-600">
              Calcula cuotas, intereses y plazos de forma automática y precisa.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Seguimiento de Pagos</h3>
            <p className="text-gray-600">
              Monitorea el estado de todos los pagos y recibe recordatorios automáticos.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Multi-Roles</h3>
            <p className="text-gray-600">
              Funciona para clientes, prestamistas y administradores por igual.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="glass-card rounded-3xl p-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Únete a nuestra plataforma y gestiona tus préstamos de manera profesional.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/register")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 text-lg rounded-full"
            data-testid="cta-register-btn"
          >
            Crear Cuenta Gratis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 border-t">
        <p>© 2025 Prestamo+. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
