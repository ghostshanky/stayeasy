import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'TENANT' | 'OWNER' | 'ADMIN'
          phone?: string
          avatar_url?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'TENANT' | 'OWNER' | 'ADMIN'
          phone?: string
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'TENANT' | 'OWNER' | 'ADMIN'
          phone?: string
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          owner_id: string
          name: string
          address: string
          description?: string
          price: number
          capacity: number
          available: boolean
          latitude?: number
          longitude?: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          address: string
          description?: string
          price: number
          capacity: number
          available?: boolean
          latitude?: number
          longitude?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          address?: string
          description?: string
          price?: number
          capacity?: number
          available?: boolean
          latitude?: number
          longitude?: number
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          property_id: string
          check_in: string
          check_out: string
          guests: number
          total_price: number
          status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id: string
          check_in: string
          check_out: string
          guests: number
          total_price: number
          status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          check_in?: string
          check_out?: string
          guests?: number
          total_price?: number
          status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          user_id: string
          owner_id: string
          amount: number
          currency: string
          status: 'AWAITING_PAYMENT' | 'AWAITING_OWNER_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'REFUNDED'
          upi_reference?: string
          verified_by?: string
          verified_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          user_id: string
          owner_id: string
          amount: number
          currency?: string
          status?: 'AWAITING_PAYMENT' | 'AWAITING_OWNER_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'REFUNDED'
          upi_reference?: string
          verified_by?: string
          verified_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          user_id?: string
          owner_id?: string
          amount?: number
          currency?: string
          status?: 'AWAITING_PAYMENT' | 'AWAITING_OWNER_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'REFUNDED'
          upi_reference?: string
          verified_by?: string
          verified_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          property_id?: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          property_id?: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          property_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          property_id: string
          rating: number
          comment?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id: string
          rating: number
          comment?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          rating?: number
          comment?: string
          created_at?: string
          updated_at?: string
        }
      }
      files: {
        Row: {
          id: string
          user_id: string
          property_id?: string
          file_name: string
          file_type: string
          file_size?: number
          url: string
          purpose: 'PROFILE_IMAGE' | 'PROPERTY_IMAGE' | 'DOCUMENT'
          status: 'AVAILABLE' | 'DELETED'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id?: string
          file_name: string
          file_type: string
          file_size?: number
          url: string
          purpose: 'PROFILE_IMAGE' | 'PROPERTY_IMAGE' | 'DOCUMENT'
          status?: 'AVAILABLE' | 'DELETED'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          file_name?: string
          file_type?: string
          file_size?: number
          url?: string
          purpose?: 'PROFILE_IMAGE' | 'PROPERTY_IMAGE' | 'DOCUMENT'
          status?: 'AVAILABLE' | 'DELETED'
          created_at?: string
        }
      }
    }
  }
}
