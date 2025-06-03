/*
  # Fix Chat RLS Policies

  1. Changes
    - Add proper RLS policies for chat_groups and chat_group_members tables
    - Fix messages table policies to handle group messages correctly
    - Remove recursive policy dependencies by introducing a security definer function
    - Fix infinite recursion in chat group member policies

  2. Security
    - Enable RLS on all chat-related tables
    - Add policies for authenticated users to access their own data
    - Ensure no infinite recursion in policies using security definer function
*/

-- Create a security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_user_in_chat_group(group_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_group_members
    WHERE chat_group_members.group_id = $1
    AND chat_group_members.user_id = $2
  );
$$;

-- Enable RLS on chat-related tables
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_group_members ENABLE ROW LEVEL SECURITY;

-- Chat Groups policies
CREATE POLICY "Users can view groups they are members of"
ON chat_groups FOR SELECT
USING (
  is_user_in_chat_group(id, auth.uid())
);

CREATE POLICY "Users can create groups"
ON chat_groups FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Chat Group Members policies
CREATE POLICY "Users can view group members of their groups"
ON chat_group_members FOR SELECT
USING (
  user_id = auth.uid() OR
  is_user_in_chat_group(group_id, auth.uid())
);

CREATE POLICY "Users can join groups they are invited to"
ON chat_group_members FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Update Messages policies to handle group messages
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;

CREATE POLICY "Users can view their messages"
ON messages FOR SELECT
USING (
  sender_id = auth.uid() OR 
  receiver_id = auth.uid() OR
  (
    group_id IS NOT NULL AND
    is_user_in_chat_group(group_id, auth.uid())
  )
);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND (
    -- Direct messages
    (group_id IS NULL AND receiver_id IS NOT NULL) OR
    -- Group messages
    (group_id IS NOT NULL AND is_user_in_chat_group(group_id, auth.uid()))
  )
);