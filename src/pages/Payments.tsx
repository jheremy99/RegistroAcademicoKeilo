import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, DollarSign } from "lucide-react";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  total_tuition: number;
}

interface Payment {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  students: {
    first_name: string;
    last_name: string;
    total_tuition: number;
  };
}

interface StudentWithPayments extends Student {
  totalPaid: number;
  status: "Pagado" | "Pago Parcial" | "Sin Pagar";
}

const Payments = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [studentsWithPayments, setStudentsWithPayments] = useState<StudentWithPayments[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [formData, setFormData] = useState({
    studentId: "",
    amount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculatePaymentStatus();
  }, [students, payments]);

  const loadData = async () => {
    try {
      const [studentsRes, paymentsRes] = await Promise.all([
        supabase.from("students").select("*"),
        supabase.from("payments").select("*, students(first_name, last_name, total_tuition)"),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      setStudents(studentsRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (error: any) {
      toast.error("Error loading data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculatePaymentStatus = () => {
    const studentPayments: Record<string, number> = {};
    payments.forEach((payment) => {
      studentPayments[payment.student_id] =
        (studentPayments[payment.student_id] || 0) + Number(payment.amount);
    });

    const studentsWithStatus = students.map((student) => {
      const totalPaid = studentPayments[student.id] || 0;
      const totalTuition = Number(student.total_tuition);
      let status: "Paid" | "Partial Payment" | "Unpaid";

      if (totalPaid >= totalTuition) {
        status = "Paid";
      } else if (totalPaid > 0) {
        status = "Partial Payment";
      } else {
        status = "Unpaid";
      }

      return { ...student, totalPaid, status };
    });

    setStudentsWithPayments(studentsWithStatus);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("payments").insert({
        student_id: formData.studentId,
        amount: formData.amount,
        payment_date: formData.paymentDate,
        notes: formData.notes || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Payment recorded successfully!");
      setIsDialogOpen(false);
      setFormData({
        studentId: "",
        amount: 0,
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Error recording payment");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-success text-success-foreground";
      case "Partial Payment":
        return "bg-warning text-warning-foreground";
      case "Unpaid":
        return "bg-destructive text-destructive-foreground";
      default:
        return "";
    }
  };

  const filteredStudents =
    filterStatus === "all"
      ? studentsWithPayments
      : studentsWithPayments.filter((s) => s.status === filterStatus);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Pagos</h1>
            <p className="text-muted-foreground mt-2">
              Realizar un seguimiento y gestionar los registros de pago de los estudiantes
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Agregar pago
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registro pagos</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student">Alumno </Label>
                  <Select
                    value={formData.studentId}
                    onValueChange={(value) => setFormData({ ...formData, studentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estudiante" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.first_name} {student.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Cantidad </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Fecha de Pago </Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Registrar pago</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <CardTitle className="flex-1">Estado de pago</CardTitle>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el estado</SelectItem>
                  <SelectItem value="Paid">Pagado</SelectItem>
                  <SelectItem value="Partial Payment">Pago Parcial</SelectItem>
                  <SelectItem value="Unpaid">No pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron estudiantes
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del estudiante</TableHead>
                    <TableHead>Matrícula total</TableHead>
                    <TableHead>Total pagado</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell>${Number(student.total_tuition).toFixed(2)}</TableCell>
                      <TableCell>${student.totalPaid.toFixed(2)}</TableCell>
                      <TableCell>
                        ${(Number(student.total_tuition) - student.totalPaid).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
