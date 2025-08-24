-- Create doctor_profiles table
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  sub_specialties TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  education JSONB[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  bio TEXT,
  -- consultation_fee INTEGER DEFAULT 0, -- Removed for compliance
  availability JSONB DEFAULT '{"days": [], "hours": ""}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create establishment_profiles table
CREATE TABLE IF NOT EXISTS establishment_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  description TEXT,
  services TEXT[] DEFAULT '{}',
  facilities TEXT[] DEFAULT '{}',
  staff_count INTEGER DEFAULT 0,
  operating_hours JSONB DEFAULT '{"days": [], "hours": ""}',
  insurance_accepted TEXT[] DEFAULT '{}',
  payment_methods TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishment_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for doctor_profiles
CREATE POLICY "Users can view their own doctor profile"
  ON doctor_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own doctor profile"
  ON doctor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own doctor profile"
  ON doctor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for establishment_profiles
CREATE POLICY "Users can view their own establishment profile"
  ON establishment_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own establishment profile"
  ON establishment_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own establishment profile"
  ON establishment_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_doctor_profiles_updated_at
  BEFORE UPDATE ON doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_establishment_profiles_updated_at
  BEFORE UPDATE ON establishment_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 