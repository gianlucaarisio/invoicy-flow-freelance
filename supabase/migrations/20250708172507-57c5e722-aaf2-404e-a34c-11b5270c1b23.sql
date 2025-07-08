
-- Test Supabase connection by creating a simple test table
CREATE TABLE public.connection_test (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_field TEXT NOT NULL DEFAULT 'Connection working!',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert a test record
INSERT INTO public.connection_test (test_field) VALUES ('Supabase connection verified');

-- Enable Row Level Security for testing
ALTER TABLE public.connection_test ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (for testing purposes)
CREATE POLICY "Allow all operations on connection_test" 
  ON public.connection_test 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
