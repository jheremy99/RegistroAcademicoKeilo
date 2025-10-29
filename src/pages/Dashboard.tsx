import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign, BookOpen, TrendingUp } from "lucide-react";

interface Stats {
  totalStudents: number;
  totalPayments: number;
  pendingPayments: number;
  averageGrade: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0, // Total de Estudiantes
    totalPayments: 0, // Total de Pagos
    pendingPayments: 0, // Pagos Pendientes
    averageGrade: 0, // Promedio de Calificaciones
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get total students
      const { count: studentsCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      // Get payment stats
      const { data: students } = await supabase
        .from("students")
        .select("id, total_tuition");

      const { data: payments } = await supabase
        .from("payments")
        .select("student_id, amount");

      let totalPaid = 0;
      let pendingCount = 0;
      const paymentsByStudent: Record<string, number> = {};

      payments?.forEach((payment) => {
        totalPaid += Number(payment.amount);
        paymentsByStudent[payment.student_id] =
          (paymentsByStudent[payment.student_id] || 0) + Number(payment.amount);
      });

      students?.forEach((student) => {
        const paid = paymentsByStudent[student.id] || 0;
        if (paid < Number(student.total_tuition)) {
          pendingCount++;
        }
      });

      // Get average grade
      const { data: grades } = await supabase
        .from("grades")
        .select("grade");

      const avgGrade =
        grades && grades.length > 0
          ? grades.reduce((sum, g) => sum + Number(g.grade), 0) / grades.length
          : 0;

      setStats({
        totalStudents: studentsCount || 0,
        totalPayments: totalPaid,
        pendingPayments: pendingCount,
        averageGrade: Math.round(avgGrade * 10) / 10,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total de estudiantes",
      value: stats.totalStudents,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Pagos totales",
      value: `$${stats.totalPayments.toFixed(2)}`,
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "Pagos pendientes",
      value: stats.pendingPayments,
      icon: TrendingUp,
      color: "text-warning",
    },
    {
      title: "Calificación promedio",
      value: stats.averageGrade || "N/A",
      icon: BookOpen,
      color: "text-info",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Descripción general de las estadísticas y métricas de la academia
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <Icon className={cn("h-8 w-8", card.color)} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{card.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Bienvenido al Sistema de Gestión de la Academia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Utilice el menú de navegación para administrar estudiantes, realizar un seguimiento de los pagos y registrar calificaciones.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <Users className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Gestión de estudiantes</h3>
                <p className="text-sm text-muted-foreground">
                  Registrar y administrar la información de los estudiantes, incluidos los datos personales y los contactos de los padres.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <DollarSign className="h-6 w-6 text-success mb-2" />
                <h3 className="font-semibold mb-1">Seguimiento de pagos</h3>
                <p className="text-sm text-muted-foreground">
                  Supervise los pagos de matrícula con detección automática de estado e historial de pagos
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <BookOpen className="h-6 w-6 text-info mb-2" />
                <h3 className="font-semibold mb-1">Registros de calificaciones</h3>
                <p className="text-sm text-muted-foreground">
                  Registre y realice un seguimiento de las calificaciones de los estudiantes en diferentes materias con observaciones detalladas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

export default Dashboard;
