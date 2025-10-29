import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const studentSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  idNumber: z.string().min(5, "El número de identificación debe tener al menos 5 caracteres"),
  dateOfBirth: z.string().min(1, "La fecha de nacimiento es requerida"),
  gradeLevel: z.string().min(1, "El grado es requerido"),
  totalTuition: z.number().min(0, "La matrícula debe ser un valor positivo"),
  parentName: z.string().min(2, "El nombre del padre debe tener al menos 2 caracteres"),
  parentIdNumber: z.string().min(5, "La identificación del padre debe tener al menos 5 caracteres"),
  parentPhone: z.string().min(10, "El teléfono debe tener al menos 10 caracteres"),
  parentAddress: z.string().optional(),
});

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  id_number: string;
  date_of_birth: string;
  grade_level: string;
  total_tuition: number;
  created_at: string;
}

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    idNumber: "",
    dateOfBirth: "",
    gradeLevel: "",
    totalTuition: 0,
    parentName: "",
    parentIdNumber: "",
    parentPhone: "",
    parentAddress: "",
  });

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast.error("Error loading students: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = studentSchema.parse(formData);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert student
      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert({
          first_name: validated.firstName,
          last_name: validated.lastName,
          id_number: validated.idNumber,
          date_of_birth: validated.dateOfBirth,
          grade_level: validated.gradeLevel,
          total_tuition: validated.totalTuition,
          created_by: user.id,
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // Insert parent
      const { error: parentError } = await supabase
        .from("parents")
        .insert({
          student_id: student.id,
          full_name: validated.parentName,
          id_number: validated.parentIdNumber,
          cell_phone: validated.parentPhone,
          address: validated.parentAddress || null,
        });

      if (parentError) throw parentError;

      toast.success("Student registered successfully!");
      setIsDialogOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        idNumber: "",
        dateOfBirth: "",
        gradeLevel: "",
        totalTuition: 0,
        parentName: "",
        parentIdNumber: "",
        parentPhone: "",
        parentAddress: "",
      });
      loadStudents();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Error registering student");
      }
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.grade_level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Estudiantes</h1>
            <p className="text-muted-foreground mt-2">
              Gestionar las inscripciones e información de los estudiantes
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Registrar Estudiante
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar nuevo estudiante</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Información del estudiante</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellido </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idNumber">DNI</Label>
                      <Input
                        id="idNumber"
                        value={formData.idNumber}
                        onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Fecha de nacimiento </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gradeLevel">Grado/Nivel </Label>
                      <Input
                        id="gradeLevel"
                        value={formData.gradeLevel}
                        onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalTuition">Matrícula total </Label>
                      <Input
                        id="totalTuition"
                        type="number"
                        step="0.01"
                        value={formData.totalTuition}
                        onChange={(e) => setFormData({ ...formData, totalTuition: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Información para padres</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="parentName">Nombre completo</Label>
                      <Input
                        id="parentName"
                        value={formData.parentName}
                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentIdNumber">DNI</Label>
                      <Input
                        id="parentIdNumber"
                        value={formData.parentIdNumber}
                        onChange={(e) => setFormData({ ...formData, parentIdNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentPhone">Celular</Label>
                      <Input
                        id="parentPhone"
                        type="tel"
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentAddress">Direcciòn (Optional)</Label>
                      <Input
                        id="parentAddress"
                        value={formData.parentAddress}
                        onChange={(e) => setFormData({ ...formData, parentAddress: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Registrar Estudiante</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or grade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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
                    <TableHead>Nombre</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Fecha de nacimiento</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell>{student.id_number}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{student.grade_level}</Badge>
                      </TableCell>
                      <TableCell>{new Date(student.date_of_birth).toLocaleDateString()}</TableCell>
                      <TableCell>${Number(student.total_tuition).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/student/${student.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Vista
                        </Button>
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

export default Students;
