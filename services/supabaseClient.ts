import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (you can generate these from your Supabase project)
export type Database = {
  public: {
    Tables: {
      vendors: {
        Row: {
          id: string
          name: string
          category: string | null
          status: string | null
          lifecycle_stage: string | null
          risk_level: string | null
          risk_score: number | null
          last_assessment_date: string | null
          description: string | null
          contact_email: string | null
          logo_url: string | null
          domains: string[] | null
          company_profile: any | null
          contacts: any | null
          security_profile: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          category?: string | null
          status?: string | null
          lifecycle_stage?: string | null
          risk_level?: string | null
          risk_score?: number | null
          last_assessment_date?: string | null
          description?: string | null
          contact_email?: string | null
          logo_url?: string | null
          domains?: string[] | null
          company_profile?: any | null
          contacts?: any | null
          security_profile?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          status?: string | null
          lifecycle_stage?: string | null
          risk_level?: string | null
          risk_score?: number | null
          last_assessment_date?: string | null
          description?: string | null
          contact_email?: string | null
          logo_url?: string | null
          domains?: string[] | null
          company_profile?: any | null
          contacts?: any | null
          security_profile?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add other tables as needed
    }
  }
}