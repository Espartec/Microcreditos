import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Users, Edit, Trash2, Shield } from "lucide-react";

export default function UserManagement({ user, onLogout }) {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [lenders, setLenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleEdit = (userData) => {
    setSelectedUser(userData);
    setEditData({
      name: userData.name,
      email: userData.email,
      role: userData.role,
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

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario ${userName}?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/users/${userId}`);
      toast.success("Usuario eliminado exitosamente");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al eliminar usuario");
    }
  };

  const UserCard = ({ userData }) => (
    <Card className="hover:shadow-md transition-shadow" data-testid={`user-card-${userData.id}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{userData.name}</CardTitle>
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
              variant="destructive"
              onClick={() => handleDelete(userData.id, userData.name)}
              data-testid={`delete-user-${userData.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
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
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="clients" data-testid="clients-tab">
              Clientes ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="lenders" data-testid="lenders-tab">
              Prestamistas ({lenders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <UserCard key={client.id} userData={client} />
              ))}
            </div>
            {clients.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No hay clientes registrados
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="lenders" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lenders.map((lender) => (
                <UserCard key={lender.id} userData={lender} />
              ))}
            </div>
            {lenders.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No hay prestamistas registrados
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
    </div>
  );
}
