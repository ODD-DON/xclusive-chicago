-- Allow public read access to the clubs table
CREATE POLICY "Allow public read access on clubs" ON public.clubs
FOR SELECT USING (true);

-- Ensure RLS is enabled on the clubs table
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Existing policies for guests table remain unchanged

