import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Public client (anon key) — for client-side use only
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server client (service role key) — bypasses RLS, use in API routes only
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : supabase // fallback to anon if service key not available

// Database types
export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          email: string
          password_hash: string | null
          first_name: string | null
          last_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          display_order: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          display_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          display_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          name: string
          slug: string
          description: string | null
          material: string | null
          base_price: number
          active: boolean
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          slug: string
          description?: string | null
          material?: string | null
          base_price: number
          active?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          material?: string | null
          base_price?: number
          active?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string | null
          guest_email: string | null
          status: string
          subtotal: number
          shipping_cost: number
          total_amount: number
          stripe_payment_intent_id: string | null
          shipping_address: any
          special_instructions: string | null
          large_order_alert_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          customer_id?: string | null
          guest_email?: string | null
          status?: string
          subtotal: number
          shipping_cost?: number
          total_amount: number
          stripe_payment_intent_id?: string | null
          shipping_address: any
          special_instructions?: string | null
          large_order_alert_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string | null
          guest_email?: string | null
          status?: string
          subtotal?: number
          shipping_cost?: number
          total_amount?: number
          stripe_payment_intent_id?: string | null
          shipping_address?: any
          special_instructions?: string | null
          large_order_alert_sent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}