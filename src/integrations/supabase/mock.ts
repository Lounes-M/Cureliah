// Mock Supabase service for development when no real Supabase instance is available
export const mockSupabaseAuth = {
  signInWithPassword: async (credentials: any) => {
    console.log('🎭 Mock sign in:', credentials.email);
    return {
      data: {
        user: {
          id: 'mock-user-id',
          email: credentials.email,
          user_metadata: { user_type: 'doctor' },
          email_confirmed_at: new Date().toISOString()
        },
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token'
        }
      },
      error: null
    };
  },

  signUp: async (credentials: any) => {
    console.log('🎭 Mock sign up:', credentials.email);
    return {
      data: {
        user: {
          id: 'mock-user-id',
          email: credentials.email,
          user_metadata: credentials.options?.data || {}
        },
        session: null
      },
      error: null
    };
  },

  signOut: async () => {
    console.log('🎭 Mock sign out');
    return { error: null };
  },

  resetPasswordForEmail: async (email: string) => {
    console.log('🎭 Mock password reset for:', email);
    return { error: null };
  },

  signInWithOAuth: async (options: any) => {
    console.log('🎭 Mock OAuth sign in:', options.provider);
    // Simulate OAuth redirect
    setTimeout(() => {
      window.location.href = options.options?.redirectTo || '/auth/callback';
    }, 1000);
    return { error: null };
  },

  getSession: async () => {
    return { data: { session: null }, error: null };
  },

  onAuthStateChange: (callback: any) => {
    // Simulate initial auth state
    setTimeout(() => callback('INITIAL_SESSION', null), 100);
    return {
      data: {
        subscription: {
          unsubscribe: () => console.log('🎭 Mock auth state unsubscribed')
        }
      }
    };
  }
};

export const mockSupabaseFrom = (table: string) => ({
  select: (columns?: string) => ({
    eq: (column: string, value: any) => ({
      single: () => Promise.resolve({ data: null, error: null }),
      order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
      limit: (count: number) => Promise.resolve({ data: [], error: null }),
      gte: (column: string, value: any) => mockSupabaseFrom(table).select(columns),
      lt: (column: string, value: any) => mockSupabaseFrom(table).select(columns),
    }),
    order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
    limit: (count: number) => Promise.resolve({ data: [], error: null }),
    then: (resolve: any) => resolve({ data: [], error: null })
  }),
  insert: (data: any) => ({
    select: () => Promise.resolve({ data: [data], error: null }),
    then: (resolve: any) => {
      console.log(`🎭 Mock insert into ${table}:`, data);
      resolve({ data: [{ ...data, id: 'mock-id' }], error: null });
    }
  }),
  update: (data: any) => ({
    eq: (column: string, value: any) => ({
      select: () => Promise.resolve({ data: [data], error: null }),
      then: (resolve: any) => {
        console.log(`🎭 Mock update ${table}:`, data);
        resolve({ data: [data], error: null });
      }
    })
  }),
  delete: () => ({
    eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
  })
});

export const createMockSupabase = () => ({
  auth: mockSupabaseAuth,
  from: mockSupabaseFrom,
  functions: {
    invoke: async (name: string, options?: any) => {
      console.log(`🎭 Mock function call: ${name}`, options);
      return { data: { status: 'success' }, error: null };
    }
  }
});
