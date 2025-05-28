
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'admin' | 'moderator' | 'user';

interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserRoles();
    } else {
      setRoles([]);
      setIsAdmin(false);
      setIsModerator(false);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRoles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      const userRoles = data?.map((item: UserRoleData) => item.role) || [];
      setRoles(userRoles);
      setIsAdmin(userRoles.includes('admin'));
      setIsModerator(userRoles.includes('moderator'));
    } catch (error) {
      console.error('Error fetching user roles:', error);
      setRoles([]);
      setIsAdmin(false);
      setIsModerator(false);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (rolesToCheck: UserRole[]): boolean => {
    return rolesToCheck.some(role => roles.includes(role));
  };

  return {
    roles,
    loading,
    isAdmin,
    isModerator,
    hasRole,
    hasAnyRole,
    refetch: fetchUserRoles
  };
};
