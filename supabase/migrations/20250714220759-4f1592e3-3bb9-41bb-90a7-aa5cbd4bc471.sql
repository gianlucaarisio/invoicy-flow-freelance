-- Phase 1: Fix Database Schema for Authentication (Handling Existing Data)

-- First, add user_id columns as nullable
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.document_line_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create a temporary test user for existing data (if any exists)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Check if we need to create a test user for existing data
    IF EXISTS (SELECT 1 FROM public.clients WHERE user_id IS NULL) OR
       EXISTS (SELECT 1 FROM public.items WHERE user_id IS NULL) OR
       EXISTS (SELECT 1 FROM public.documents WHERE user_id IS NULL) OR
       EXISTS (SELECT 1 FROM public.document_line_items WHERE user_id IS NULL) THEN
       
        -- Create a test user in auth.users for existing data
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'testuser@example.com',
            crypt('temppassword123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"display_name":"Test User"}',
            false,
            '',
            '',
            '',
            ''
        ) RETURNING id INTO test_user_id;
        
        -- Assign existing data to this test user
        UPDATE public.clients SET user_id = test_user_id WHERE user_id IS NULL;
        UPDATE public.items SET user_id = test_user_id WHERE user_id IS NULL;
        UPDATE public.documents SET user_id = test_user_id WHERE user_id IS NULL;
        UPDATE public.document_line_items SET user_id = test_user_id WHERE user_id IS NULL;
    END IF;
END $$;

-- Now make user_id NOT NULL for future records
ALTER TABLE public.clients ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.items ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.documents ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.document_line_items ALTER COLUMN user_id SET NOT NULL;

-- Create profiles table for additional user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on clients" ON public.clients;
DROP POLICY IF EXISTS "Allow all operations on items" ON public.items;
DROP POLICY IF EXISTS "Allow all operations on documents" ON public.documents;
DROP POLICY IF EXISTS "Allow all operations on document_line_items" ON public.document_line_items;

-- Create proper RLS policies for user-specific data access
CREATE POLICY "Users can manage their own clients" 
ON public.clients 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own items" 
ON public.items 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own documents" 
ON public.documents 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own document line items" 
ON public.document_line_items 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own profile" 
ON public.profiles 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();