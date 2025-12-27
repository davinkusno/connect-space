// Custom types for Supabase database schema
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          email: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          email: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          email?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      communities: {
        Row: {
          id: string
          name: string
          description: string | null
          creator_id: string
          created_at: string
          updated_at: string | null
          banner_url: string | null
          logo_url: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          creator_id: string
          created_at?: string
          updated_at?: string | null
          banner_url?: string | null
          logo_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          creator_id?: string
          created_at?: string
          updated_at?: string | null
          banner_url?: string | null
          logo_url?: string | null
        }
      }
      community_members: {
        Row: {
          id: string
          community_id: string
          user_id: string
          role: "admin" | "moderator" | "member"
          joined_at: string
          status: boolean | null
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          role?: "admin" | "moderator" | "member"
          joined_at?: string
          status?: boolean | null
        }
        Update: {
          id?: string
          community_id?: string
          user_id?: string
          role?: "admin" | "moderator" | "member"
          joined_at?: string
          status?: boolean | null
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          location: string | null
          start_time: string
          end_time: string
          image_url: string | null
          community_id: string
          creator_id: string
          created_at: string
          updated_at: string
          is_online: boolean
          max_attendees: number | null
          category: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          location?: string | null
          start_time: string
          end_time: string
          image_url?: string | null
          community_id: string
          creator_id: string
          created_at?: string
          updated_at?: string
          is_online?: boolean
          max_attendees?: number | null
          category?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          location?: string | null
          start_time?: string
          end_time?: string
          image_url?: string | null
          community_id?: string
          creator_id?: string
          created_at?: string
          updated_at?: string
          is_online?: boolean
          max_attendees?: number | null
          category?: string | null
        }
      }
      event_attendees: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: "going" | "maybe" | "not_going"
          registered_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: "going" | "maybe" | "not_going"
          registered_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: "going" | "maybe" | "not_going"
          registered_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          content: string
          sender_id: string
          community_id: string
          created_at: string
          updated_at: string | null
          parent_id: string | null
          media_url: string | null
          media_type: string | null
          media_size: number | null
          media_mime_type: string | null
        }
        Insert: {
          id?: string
          content: string
          sender_id: string
          community_id: string
          created_at?: string
          updated_at?: string | null
          parent_id?: string | null
          media_url?: string | null
          media_type?: string | null
          media_size?: number | null
          media_mime_type?: string | null
        }
        Update: {
          id?: string
          content?: string
          sender_id?: string
          community_id?: string
          created_at?: string
          updated_at?: string | null
          parent_id?: string | null
          media_url?: string | null
          media_type?: string | null
          media_size?: number | null
          media_mime_type?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: "event_reminder" | "new_message" | "community_invite" | "community_update"
          content: string
          is_read: boolean
          created_at: string
          reference_id: string | null
          reference_type: "event" | "message" | "community" | null
        }
        Insert: {
          id?: string
          user_id: string
          type: "event_reminder" | "new_message" | "community_invite" | "community_update"
          content: string
          is_read?: boolean
          created_at?: string
          reference_id?: string | null
          reference_type?: "event" | "message" | "community" | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: "event_reminder" | "new_message" | "community_invite" | "community_update"
          content?: string
          is_read?: boolean
          created_at?: string
          reference_id?: string | null
          reference_type?: "event" | "message" | "community" | null
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme: "light" | "dark" | "system"
          email_notifications: boolean
          push_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: "light" | "dark" | "system"
          email_notifications?: boolean
          push_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: "light" | "dark" | "system"
          email_notifications?: boolean
          push_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          report_type: "community" | "post" | "member" | "event"
          target_id: string
          reason: string
          details: string | null
          status: "pending" | "reviewing" | "resolved" | "dismissed"
          reviewed_by: string | null
          review_notes: string | null
          created_at: string
          updated_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          reporter_id: string
          report_type: "community" | "post" | "member" | "event"
          target_id: string
          reason: string
          details?: string | null
          status?: "pending" | "reviewing" | "resolved" | "dismissed"
          reviewed_by?: string | null
          review_notes?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          reporter_id?: string
          report_type?: "community" | "post" | "member" | "event"
          target_id?: string
          reason?: string
          details?: string | null
          status?: "pending" | "reviewing" | "resolved" | "dismissed"
          reviewed_by?: string | null
          review_notes?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type InsertTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type UpdateTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
