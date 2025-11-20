import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Users, Edit, Power, Shield, Search, AlertTriangle, Eye } from "lucide-react";

export default function UserManagement({ user, onLogout }) {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [lenders, setLenders] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [filteredLenders, setFilteredLenders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [alertDialog, setAlertDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeLoansInfo, setActiveLoansInfo] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    role: "",
    cedula: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, clients, lenders]);

  const fetchUsers = async () => {
    try {
      const [clientsRes, lendersRes] = await Promise.all([
        axios.get(`${API}/users?role=client`),
        axios.get(`${API}/users?role=lender`)
      ]);
      setClients(clientsRes.data);
      setLenders(lendersRes.data);
    } catch (error) {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    const term = searchTerm.toLowerCase();
    
    const filtClients = clients.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.cedula && c.cedula.includes(term)) ||
      (c.phone && c.phone.includes(term))
    );
    
    const filtLenders = lenders.filter(l => 
      l.name.toLowerCase().includes(term) ||
      l.email.toLowerCase().includes(term) ||
      (l.cedula && l.cedula.includes(term)) ||
      (l.phone && l.phone.includes(term))
    );
    
    setFilteredClients(filtClients);
    setFilteredLenders(filtLenders);
  };

  const handleEdit = (userData) => {
    setSelectedUser(userData);
    setEditData({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      cedula: userData.cedula || "",
      phone: userData.phone || "",
      address: userData.address || ""
    });
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API}/users/${selectedUser.id}`, editData);
      toast.success("Usuario actualizado exitosamente");
      setEditDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al actualizar usuario");
    }
  };

  const handleViewClientLoans = () => {
    setAlertDialog(false);
    if (selectedUser && selectedUser.role === "lender") {
      navigate(`/lender/${selectedUser.id}/clients`);
    } else {
      navigate(`/client/${selectedUser.id}`);
    }
  };

  const handleToggleActive = async (userId, userName, currentStatus, userRole) => {
    // Si está activo, verificar préstamos antes de desactivar
    if (currentStatus) {
      try {
        const response = await axios.get(`${API}/users/${userId}/active-loans`);
        
        if (response.data.has_active_loans) {
          setSelectedUser({ id: userId, name: userName, role: userRole });
          setActiveLoansInfo(response.data);
          setAlertDialog(true);
          return;
        }
      } catch (error) {
        toast.error("Error al verificar préstamos");
        return;
      }
    }

    // Si no hay préstamos activos o está reactivando, proceder
    try {
      const response = await axios.put(`${API}/users/${userId}/toggle-active`);
      toast.success(response.data.message);
      fetchUsers();
    } catch (error) {
      toast.error("Error al cambiar estado del usuario");
    }
  };

  const UserCard = ({ userData }) => {
    const isActive = userData.active !== false;
    
    return (
      <Card 
        className={`hover:shadow-md transition-shadow ${
          !isActive ? 'opacity-60 border-red-200 bg-red-50/30' : ''
        }`}
        data-testid={`user-card-${userData.id}`}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg">{userData.name}</CardTitle>
                {!isActive && (
                  <span className="status-badge bg-red-100 text-red-700 text-xs">Inactivo</span>
                )}
              </div>
              <CardDescription>{userData.email}</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(userData)}
                data-testid={`edit-user-${userData.id}`}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={isActive ? "destructive" : "default"}
                className={!isActive ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                onClick={() => handleToggleActive(userData.id, userData.name, isActive)}
                data-testid={`toggle-user-${userData.id}`}
              >
                <Power className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {userData.cedula && (
              <p className="text-gray-600">🆔 Cédula: {userData.cedula}</p>
            )}
            {userData.phone && (
              <p className="text-gray-600">📞 {userData.phone}</p>
            )}
            {userData.address && (
              <p className="text-gray-600">📍 {userData.address}</p>
            )}
            <div className="pt-2">
              <span className={`status-badge ${userData.role === 'client' ? 'status-pending' : 'status-active'}`}>
                {userData.role === 'client' ? 'Cliente' : 'Prestamista'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Gestión de Usuarios</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por nombre, email, cédula o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-lg"
              data-testid="search-input"
            />
          </div>
        </div>

        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="clients" data-testid="clients-tab">
              Clientes ({filteredClients.length})
            </TabsTrigger>
            <TabsTrigger value="lenders" data-testid="lenders-tab">
              Prestamistas ({filteredLenders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => (
                <UserCard key={client.id} userData={client} />
              ))}
            </div>
            {filteredClients.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  {searchTerm ? "No se encontraron clientes con ese criterio" : "No hay clientes registrados"}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="lenders" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLenders.map((lender) => (
                <UserCard key={lender.id} userData={lender} />
              ))}
            </div>
            {filteredLenders.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  {searchTerm ? "No se encontraron prestamistas con ese criterio" : "No hay prestamistas registrados"}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent data-testid="edit-user-dialog">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del usuario
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  data-testid="edit-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  data-testid="edit-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={editData.role}
                  onValueChange={(value) => setEditData({ ...editData, role: value })}
                >
                  <SelectTrigger data-testid="edit-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="lender">Prestamista</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Número de Cédula</Label>
                <Input
                  value={editData.cedula}
                  onChange={(e) => setEditData({ ...editData, cedula: e.target.value })}
                  data-testid="edit-cedula-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  data-testid="edit-phone-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  data-testid="edit-address-input"
                />
              </div>
              <Button
                onClick={handleSaveEdit}
                className="w-full bg-blue-600 hover:bg-blue-700"
                data-testid="save-user-btn"
              >
                <Shield className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Active Loans Alert Dialog */}
      <AlertDialog open={alertDialog} onOpenChange={setAlertDialog}>
        <AlertDialogContent data-testid="active-loans-alert">
          <AlertDialogHeader>
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <AlertDialogTitle>Usuario con Préstamos Activos</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3 pt-4">
              <p>
                El usuario <strong>{selectedUser?.name}</strong> tiene{" "}
                <strong>{activeLoansInfo?.active_loans_count}</strong> préstamo(s) activo(s) o pendiente(s).
              </p>
              <p>
                ¿Deseas ver el perfil del cliente y sus préstamos antes de desactivar la cuenta?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-alert-btn">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleViewClientLoans}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="view-client-btn"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Perfil del Cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
