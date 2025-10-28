import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, User, Users as UsersIcon, DollarSign, BookOpen } from "lucide-react";

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  id_number: string;
  date_of_birth: string;
  grade_level: string;
  total_tuition: number;
  created_at: string;
}

interface Parent {
  full_name: string;
  id_number: string;
  cell_phone: string;
  address: string | null;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
}

interface Grade {
  id: string;
  grade: number;
  observations: string | null;
  created_at: string;
  subjects: {
    name: string;
  };
}

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [parent, setParent] = useState<Parent | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadStudentData();
    }
  }, [id]);

  const loadStudentData = async () => {
    try {
      const [studentRes, parentRes, paymentsRes, gradesRes] = await Promise.all([
        supabase.from("students").select("*").eq("id", id).single(),
        supabase.from("parents").select("*").eq("student_id", id).single(),
        supabase.from("payments").select("*").eq("student_id", id).order("payment_date", { ascending: false }),
        supabase
          .from("grades")
          .select("*, subjects(name)")
          .eq("student_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (studentRes.error) throw studentRes.error;
      setStudent(studentRes.data);
      setParent(parentRes.data);
      setPayments(paymentsRes.data || []);
      setGrades(gradesRes.data || []);
    } catch (error: any) {
      toast.error("Error loading student data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Student not found</p>
          <Button onClick={() => navigate("/students")} className="mt-4">
            Back to Students
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const balance = Number(student.total_tuition) - totalPaid;
  const paymentStatus =
    totalPaid >= Number(student.total_tuition)
      ? "Paid"
      : totalPaid > 0
      ? "Partial Payment"
      : "Unpaid";

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/students")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Students
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {student.first_name} {student.last_name}
            </h1>
            <p className="text-muted-foreground mt-2">Student ID: {student.id_number}</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {student.grade_level}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Student Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Birth:</span>
                <span className="font-medium">
                  {new Date(student.date_of_birth).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grade Level:</span>
                <span className="font-medium">{student.grade_level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registration Date:</span>
                <span className="font-medium">
                  {new Date(student.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Parent Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Parent Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {parent ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Full Name:</span>
                    <span className="font-medium">{parent.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID Number:</span>
                    <span className="font-medium">{parent.id_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{parent.cell_phone}</span>
                  </div>
                  {parent.address && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="font-medium">{parent.address}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No parent information available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Tuition</p>
                <p className="text-2xl font-bold">${Number(student.total_tuition).toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-success">${totalPaid.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-2xl font-bold text-destructive">${balance.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(paymentStatus)}>{paymentStatus}</Badge>
              </div>
            </div>

            <Separator className="my-6" />

            <h3 className="font-semibold mb-4">Payment History</h3>
            {payments.length === 0 ? (
              <p className="text-muted-foreground">No payments recorded</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-semibold">${Number(payment.amount).toFixed(2)}</TableCell>
                      <TableCell>{payment.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Academic Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {grades.length === 0 ? (
              <p className="text-muted-foreground">No grades recorded</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Observations</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{grade.subjects.name}</TableCell>
                      <TableCell>
                        <span className="text-lg font-semibold">{Number(grade.grade).toFixed(2)}</span>
                      </TableCell>
                      <TableCell>{grade.observations || "-"}</TableCell>
                      <TableCell>{new Date(grade.created_at).toLocaleDateString()}</TableCell>
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

export default StudentDetail;
