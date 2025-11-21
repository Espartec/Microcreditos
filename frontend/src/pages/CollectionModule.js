import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Calendar, DollarSign, User, Phone } from "lucide-react";

export default function CollectionModule({ user, onLogout }) {
  const navigate = useNavigate();
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [todayRes, allRes] = await Promise.all([
        axios.get(`${API}/schedules/today`),
        axios.get(`${API}/schedules?status=pending`)
      ]);
      setTodaySchedules(todayRes.data);
      setAllSchedules(allRes.data);
    } catch (error) {
      toast.error("Error al cargar programación de cobros");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDate = async () => {
    if (!newDate) {
      toast.error("Selecciona una fecha");
      return;
    }

    try {
      await axios.put(`${API}/schedules/${selectedSchedule.id}/update-date`, {
        due_date: new Date(newDate).toISOString()
      });
      toast.success("Fecha de cobro actualizada");
      setEditDialog(false);
      setSelectedSchedule(null);
      setNewDate("");
      fetchData();
    } catch (error) {
      toast.error("Error al actualizar fecha");
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
              onClick={() => navigate(-1)}
              data-testid="back-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Módulo de Cobros</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Today's Collections */}
        <Card className="glass-card mb-8" data-testid="today-collections-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-6 h-6" />
              <span>Cobros de Hoy</span>
            </CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaySchedules.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay cobros programados para hoy</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg"
                    data-testid={`today-schedule-${schedule.id}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg" data-testid={`client-name-${schedule.id}`}>{schedule.client_name}</p>
                          <p className="text-sm text-gray-600">Cuota #{schedule.payment_number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-600">${schedule.amount}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-amber-200">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/loan/${schedule.loan_id}`)}
                        data-testid={`view-loan-${schedule.id}`}
                      >
                        Ver Préstamo
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setNewDate(new Date(schedule.due_date).toISOString().split('T')[0]);
                          setEditDialog(true);
                        }}
                        data-testid={`edit-date-${schedule.id}`}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Cambiar Fecha
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Pending Collections */}
        <Card data-testid="all-collections-card">
          <CardHeader>
            <CardTitle>Todos los Cobros Pendientes</CardTitle>
            <CardDescription>
              Total: {allSchedules.length} cobros pendientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allSchedules.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>No hay cobros pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allSchedules.map((schedule) => {
                  const dueDate = new Date(schedule.due_date);
                  const today = new Date();
                  const isToday = dueDate.toDateString() === today.toDateString();
                  const isPast = dueDate < today && !isToday;

                  return (
                    <div
                      key={schedule.id}
                      className={`p-4 rounded-lg border flex justify-between items-center ${
                        isToday
                          ? "bg-amber-50 border-amber-200"
                          : isPast
                          ? "bg-red-50 border-red-200"
                          : "bg-white border-gray-200"
                      }`}
                      data-testid={`schedule-${schedule.id}`}
                    >
                      <div>
                        <p className="font-semibold" data-testid={`schedule-client-${schedule.id}`}>{schedule.client_name}</p>
                        <p className="text-sm text-gray-600">Cuota #{schedule.payment_number}</p>
                        <p className="text-sm text-gray-600">
                          Vence: {dueDate.toLocaleDateString('es-ES')}
                          {isPast && <span className="text-red-600 font-semibold ml-2">(Vencido)</span>}
                          {isToday && <span className="text-amber-600 font-semibold ml-2">(Hoy)</span>}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <p className="text-xl font-bold">${schedule.amount}</p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/loan/${schedule.loan_id}`)}
                            data-testid={`view-loan-btn-${schedule.id}`}
                          >
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedSchedule(schedule);
                              setNewDate(dueDate.toISOString().split('T')[0]);
                              setEditDialog(true);
                            }}
                            data-testid={`edit-btn-${schedule.id}`}
                          >
                            Editar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Date Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent data-testid="edit-date-dialog">
          <DialogHeader>
            <DialogTitle>Cambiar Fecha de Cobro</DialogTitle>
            <DialogDescription>
              Actualiza la fecha de vencimiento de esta cuota
            </DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Cliente: <span className="font-semibold">{selectedSchedule.client_name}</span></p>
                <p className="text-sm text-gray-600">Cuota: <span className="font-semibold">#{selectedSchedule.payment_number}</span></p>
                <p className="text-sm text-gray-600">Monto: <span className="font-semibold">${selectedSchedule.amount}</span></p>
              </div>
              <div className="space-y-2">
                <Label>Nueva Fecha de Vencimiento</Label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  data-testid="new-date-input"
                />
              </div>
              <Button
                onClick={handleUpdateDate}
                className="w-full bg-blue-600 hover:bg-blue-700"
                data-testid="confirm-date-btn"
              >
                Actualizar Fecha
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
