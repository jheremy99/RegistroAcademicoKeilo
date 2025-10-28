-- Create profiles table for admin users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin User'),
    'admin'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  id_number TEXT NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL,
  grade_level TEXT NOT NULL,
  total_tuition DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all students"
  ON public.students FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert students"
  ON public.students FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update students"
  ON public.students FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete students"
  ON public.students FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create parents table
CREATE TABLE public.parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  cell_phone TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all parents"
  ON public.parents FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert parents"
  ON public.parents FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update parents"
  ON public.parents FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete parents"
  ON public.parents FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete payments"
  ON public.payments FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all subjects"
  ON public.subjects FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert subjects"
  ON public.subjects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update subjects"
  ON public.subjects FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete subjects"
  ON public.subjects FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create grades table
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  grade DECIMAL(5,2) NOT NULL,
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  UNIQUE(student_id, subject_id, created_at)
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all grades"
  ON public.grades FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert grades"
  ON public.grades FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update grades"
  ON public.grades FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete grades"
  ON public.grades FOR DELETE
  USING (auth.role() = 'authenticated');

-- Insert some default subjects
INSERT INTO public.subjects (name, description) VALUES
  ('Mathematics', 'Mathematics course'),
  ('Science', 'Science course'),
  ('Language Arts', 'Language and literature'),
  ('Social Studies', 'History and geography'),
  ('Physical Education', 'Physical education and sports');
