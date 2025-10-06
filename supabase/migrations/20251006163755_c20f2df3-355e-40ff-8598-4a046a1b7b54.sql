-- Create table for launch reservations
CREATE TABLE public.launch_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.launch_reservations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert reservations (public form)
CREATE POLICY "Anyone can create reservations"
ON public.launch_reservations
FOR INSERT
WITH CHECK (true);

-- Only authenticated users can view reservations (for admin purposes)
CREATE POLICY "Authenticated users can view reservations"
ON public.launch_reservations
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create index for email lookups
CREATE INDEX idx_launch_reservations_email ON public.launch_reservations(email);
CREATE INDEX idx_launch_reservations_created_at ON public.launch_reservations(created_at DESC);