import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DollarSign, ArrowLeft, Plus, Trash2, Edit, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ExpensesPage({ user }) {
  const navigate = useNavigate();
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [editingFixed, setEditingFixed] = useState(null);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    type: "general" // 'fixed' o 'general'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fixedRes, monthlyRes] = await Promise.all([
        axios.get(`${API}/admin/fixed-expenses`),
        axios.get(`${API}/admin/expenses`)
      ]);
      setFixedExpenses(fixedRes.data);
      setMonthlyExpenses(monthlyRes.data);
    } catch (error) {
      toast.error("Error al cargar gastos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      const now = new Date();
      
      if (newExpense.type === "fixed") {
        // Agregar gasto fijo
        await axios.post(
          `${API}/admin/fixed-expenses?admin_id=${user.id}`,
          {
            description: newExpense.description,
            amount: parseInt(newExpense.amount)
          }
        );
        toast.success("Gasto fijo agregado exitosamente");
      } else {
        // Agregar gasto general (solo este mes)
        await axios.post(
          `${API}/admin/expenses?admin_id=${user.id}`,
          {
            description: newExpense.description,
            amount: parseInt(newExpense.amount),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            is_fixed: false
          }
        );
        toast.success("Gasto general agregado exitosamente");
      }
      
      setNewExpense({ description: "", amount: "", type: "general" });
      setAddDialog(false);
      fetchData();
    } catch (error) {
      toast.error("Error al agregar gasto");
    }
  };

  const handleDeleteFixed = async (expenseId) => {
    if (!window.confirm("¿Estás seguro de eliminar este gasto fijo? No se aplicará en los próximos meses.")) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/fixed-expenses/${expenseId}`);
      toast.success("Gasto fijo eliminado");
      fetchData();
    } catch (error) {
      toast.error("Error al eliminar gasto fijo");
    }
  };

  const handleDeleteGeneral = async (expenseId) => {
    if (!window.confirm("¿Estás seguro de eliminar este gasto?")) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/expenses/${expenseId}`);
      toast.success("Gasto eliminado");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al eliminar gasto");
    }
  };

  const handleUpdateFixed = async (expenseId) => {
    if (!editingFixed.description || !editingFixed.amount) {
      toast.error("Completa todos los campos");
      return;
    }

    try {
      await axios.put(`${API}/admin/fixed-expenses/${expenseId}`, {
        description: editingFixed.description,
        amount: parseInt(editingFixed.amount)
      });
      toast.success("Gasto fijo actualizado");
      setEditingFixed(null);
      fetchData();
    } catch (error) {
      toast.error("Error al actualizar gasto");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const generalExpenses = monthlyExpenses.filter(exp => !exp.is_fixed);
  const totalFixed = fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalGeneral = generalExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalExpenses = totalFixed + totalGeneral;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Gestión de Gastos</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Total Gastos del Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-700">${totalExpenses.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-800">Gastos Fijos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-700">${totalFixed.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">{fixedExpenses.length} gastos fijos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-800">Gastos Generales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-700">${totalGeneral.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">{generalExpenses.length} gastos este mes</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mb-6">
          <Button
            onClick={() => setAddDialog(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Gasto
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fixed Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos Fijos / Recurrentes</CardTitle>
              <CardDescription>
                Estos gastos se aplican automáticamente cada mes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fixedExpenses.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay gastos fijos registrados</p>
                ) : (
                  fixedExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                      {editingFixed?.id === expense.id ? (
                        <div className="flex-1 flex items-center space-x-3">
                          <Input
                            value={editingFixed.description}
                            onChange={(e) => setEditingFixed({ ...editingFixed, description: e.target.value })}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={editingFixed.amount}
                            onChange={(e) => setEditingFixed({ ...editingFixed, amount: e.target.value })}
                            className="w-32"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateFixed(expense.id)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingFixed(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{expense.description}</p>
                            <p className="text-sm text-purple-600 font-medium">${expense.amount.toLocaleString()}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingFixed({ id: expense.id, description: expense.description, amount: expense.amount })}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteFixed(expense.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* General/Monthly Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos Generales del Mes</CardTitle>
              <CardDescription>
                Gastos adicionales solo para este mes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generalExpenses.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay gastos generales este mes</p>
                ) : (
                  generalExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{expense.description}</p>
                        <p className="text-sm text-amber-600 font-medium">${expense.amount.toLocaleString()}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteGeneral(expense.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Expense Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Gasto</DialogTitle>
            <DialogDescription>
              Elige si es un gasto fijo (recurrente) o general (solo este mes)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Gasto</Label>
              <div className="flex space-x-3 mt-2">
                <Button
                  variant={newExpense.type === "general" ? "default" : "outline"}
                  onClick={() => setNewExpense({ ...newExpense, type: "general" })}
                  className="flex-1"
                >
                  General (Este mes)
                </Button>
                <Button
                  variant={newExpense.type === "fixed" ? "default" : "outline"}
                  onClick={() => setNewExpense({ ...newExpense, type: "fixed" })}
                  className="flex-1"
                >
                  Fijo (Recurrente)
                </Button>
              </div>
            </div>

            <div>
              <Label>Descripción</Label>
              <Input
                placeholder="Ej: Renta de oficina, Publicidad Facebook, etc."
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              />
            </div>

            <div>
              <Label>Monto</Label>
              <Input
                type="number"
                placeholder="0"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              />
            </div>

            <Button
              onClick={handleAddExpense}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Gasto {newExpense.type === "fixed" ? "Fijo" : "General"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
