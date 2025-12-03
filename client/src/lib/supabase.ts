import { createClient } from '@supabase/supabase-js'

// Use VITE_ prefixed variables for client-side, fallback to non-prefixed for server-side
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Add validation to ensure we have proper credentials
if (supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key') {
  console.warn('⚠️  WARNING: Using default Supabase placeholder values.')
  console.warn('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
  console.warn('   Authentication and database features will not work properly.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password: string
          name: string
          role: 'TENANT' | 'OWNER' | 'ADMIN'
          email_verified: boolean
          email_token?: string
          email_token_expiry?: string
          image_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password: string
          name: string
          role?: 'TENANT' | 'OWNER' | 'ADMIN'
          email_verified?: boolean
          email_token?: string
          email_token_expiry?: string
          image_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password?: string
          name?: string
          role?: 'TENANT' | 'OWNER' | 'ADMIN'
          email_verified?: boolean
          email_token?: string
          email_token_expiry?: string
          image_id?: string
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
          created_at?: string
          updated_at?: string
        }
      }
      property_details: {
        Row: {
          id: string
          property_id: string
          amenity: string
          value: string
        }
        Insert: {
          id?: string
          property_id: string
          amenity: string
          value: string
        }
        Update: {
          id?: string
          property_id?: string
          amenity?: string
          value?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          property_id: string
          check_in: string
          check_out: string
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
          upi_uri?: string
          upi_reference?: string
          status: 'PENDING' | 'AWAITING_PAYMENT' | 'AWAITING_OWNER_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED' | 'COMPLETED' | 'FAILED'
          verified_by?: string
          verified_at?: string
          rejection_reason?: string
          completed_at?: string
          refunded_at?: string
          refund_amount?: number
          refund_reason?: string
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
          upi_uri?: string
          upi_reference?: string
          status?: 'PENDING' | 'AWAITING_PAYMENT' | 'AWAITING_OWNER_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED' | 'COMPLETED' | 'FAILED'
          verified_by?: string
          verified_at?: string
          rejection_reason?: string
          completed_at?: string
          refunded_at?: string
          refund_amount?: number
          refund_reason?: string
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
          upi_uri?: string
          upi_reference?: string
          status?: 'PENDING' | 'AWAITING_PAYMENT' | 'AWAITING_OWNER_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED' | 'COMPLETED' | 'FAILED'
          verified_by?: string
          verified_at?: string
          rejection_reason?: string
          completed_at?: string
          refunded_at?: string
          refund_amount?: number
          refund_reason?: string
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          payment_id: string
          details: string
          invoice_no: string
          booking_id: string
          user_id: string
          owner_id: string
          line_items: any
          amount: number
          status: string
          pdf_file_id?: string
          created_at: string
        }
        Insert: {
          id?: string
          payment_id: string
          details: string
          invoice_no: string
          booking_id: string
          user_id: string
          owner_id: string
          line_items: any
          amount: number
          status: string
          pdf_file_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          payment_id?: string
          details?: string
          invoice_no?: string
          booking_id?: string
          user_id?: string
          owner_id?: string
          line_items?: any
          amount?: number
          status?: string
          pdf_file_id?: string
          created_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          user_id: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          recipient_id: string
          sender_type: string
          content: string
          read_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          recipient_id: string
          sender_type: string
          content: string
          read_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          sender_id?: string
          recipient_id?: string
          sender_type?: string
          content?: string
          read_at?: string
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
        }
        Insert: {
          id?: string
          user_id: string
          property_id: string
          rating: number
          comment?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          rating?: number
          comment?: string
          created_at?: string
        }
      }
      files: {
        Row: {
          id: string
          url: string
          thumbnail_url?: string
          file_name: string
          file_type: string
          size?: number
          status: 'UPLOADING' | 'AVAILABLE' | 'ERROR'
          purpose?: string
          user_id: string
          property_id?: string
          message_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          url: string
          thumbnail_url?: string
          file_name: string
          file_type: string
          size?: number
          status?: 'UPLOADING' | 'AVAILABLE' | 'ERROR'
          purpose?: string
          user_id: string
          property_id?: string
          message_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          url?: string
          thumbnail_url?: string
          file_name?: string
          file_type?: string
          size?: number
          status?: 'UPLOADING' | 'AVAILABLE' | 'ERROR'
          purpose?: string
          user_id?: string
          property_id?: string
          message_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          expires_at?: string
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          actor_id?: string
          action: string
          details?: string
          user_id?: string
          booking_id?: string
          payment_id?: string
          invoice_id?: string
          review_id?: string
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string
          action: string
          details?: string
          user_id?: string
          booking_id?: string
          payment_id?: string
          invoice_id?: string
          review_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string
          action?: string
          details?: string
          user_id?: string
          booking_id?: string
          payment_id?: string
          invoice_id?: string
          review_id?: string
          created_at?: string
        }
      }
      refresh_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          device?: string
          ip?: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          device?: string
          ip?: string
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          device?: string
          ip?: string
          created_at?: string
          expires_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          read?: boolean
          created_at?: string
        }
      }
      refunds: {
        Row: {
          id: string
          payment_id: string
          amount: number
          reason?: string
          status: string
          processed_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          payment_id: string
          amount: number
          reason?: string
          status?: string
          processed_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          payment_id?: string
          amount?: number
          reason?: string
          status?: string
          processed_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      availabilities: {
        Row: {
          id: string
          property_id: string
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          start_date: string
          end_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          start_date?: string
          end_date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
