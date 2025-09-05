// Development Authentication Override
// This file provides mock authentication to bypass Supabase 401 errors during development

export const createDevUser = () => ({
  id: 'dev-user-123',
  email: 'dev@example.com',
  name: 'Development User',
  role: 'admin',
  created_at: new Date().toISOString()
});

export const mockSupabaseClient = {
  auth: {
    getSession: async () => ({
      data: { session: { user: createDevUser() } },
      error: null
    }),
    getUser: async () => ({
      data: { user: createDevUser() },
      error: null
    })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: [], error: null })
      }),
      order: () => ({ data: [], error: null }),
      limit: () => ({ data: [], error: null })
    }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null })
  })
};

// Function to check if we should use dev mode
export const shouldUseDev = () => {
  return process.env.NODE_ENV === 'development' && 
         (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY);
}; 