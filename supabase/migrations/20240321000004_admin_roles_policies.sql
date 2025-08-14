-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Create a secure function to check admin status without recursion
CREATE OR REPLACE FUNCTION check_admin_status()
RETURNS BOOLEAN AS $$
BEGIN
  -- Direct check without using EXISTS to avoid recursion
  RETURN (
    SELECT COUNT(*) > 0
    FROM admin_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND revoked_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies using the secure function
CREATE POLICY "Admins can view all admin roles"
ON admin_roles
FOR SELECT
USING (check_admin_status());

CREATE POLICY "Admins can manage admin roles"
ON admin_roles
FOR ALL
USING (check_admin_status());

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Direct check without using EXISTS to avoid recursion
  RETURN (
    SELECT COUNT(*) > 0
    FROM admin_roles
    WHERE admin_roles.user_id = $1
    AND role = 'admin'
    AND revoked_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for documents table
CREATE POLICY "Users can view their own documents"
ON documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents"
ON documents
FOR SELECT
USING (check_admin_status());

CREATE POLICY "Users can upload their own documents"
ON documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can upload documents for any user"
ON documents
FOR INSERT
WITH CHECK (check_admin_status());

CREATE POLICY "Users can delete their own documents"
ON documents
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any document"
ON documents
FOR DELETE
USING (check_admin_status()); 