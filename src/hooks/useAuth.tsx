
import { useState, useEffect, createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { Profile } from '@/types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, userData: { first_name: string; last_name: string; user_type: string }) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  fetchProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null)
      return
    }
    
    try {
      console.log('Fetching profile for user:', user.id)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('Error fetching profile:', error)
        if (error.code !== 'PGRST116') { // PGRST116 means no rows returned
          throw error
        }
        // If no profile found, set to null
        setProfile(null)
      } else {
        console.log('Profile fetched successfully:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  useEffect(() => {
    console.log('Setting up auth state listener')
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        setSession(session)
        setUser(session?.user ?? null)
        
        // Clear profile when user logs out
        if (!session?.user) {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      console.log('Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [])

  // Fetch profile when user changes
  useEffect(() => {
    if (user) {
      // Use setTimeout to avoid potential deadlock
      setTimeout(() => {
        fetchProfile()
      }, 0)
    } else {
      setProfile(null)
    }
  }, [user])

  const signUp = async (email: string, password: string, userData: { first_name: string; last_name: string; user_type: string }) => {
    console.log('SignUp called with:', { email, userData })
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      
      console.log('Supabase signUp response:', { data, error })
      return { data, error }
    } catch (error) {
      console.error('Unexpected error in signUp:', error)
      return { data: null, error }
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('SignIn called with email:', email)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      console.log('Supabase signIn response:', { data, error })
      return { data, error }
    } catch (error) {
      console.error('Unexpected error in signIn:', error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    console.log('SignOut called')
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('SignOut error:', error)
        throw error
      }
      setProfile(null)
      console.log('SignOut successful')
    } catch (error) {
      console.error('Error during signOut:', error)
      throw error
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    fetchProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
