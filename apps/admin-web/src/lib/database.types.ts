// Generado desde Supabase (proyecto kg-visit-V2). No editar a mano.
// Regenerar: supabase gen types typescript --project-id ljzzuwltgezvwpelavdz

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cameras: {
        Row: {
          automatic: boolean
          camera_type: string | null
          id: string
          kind: string | null
          name: string
          reference: string | null
          residential_id: string
          security_booth_id: string | null
          status: boolean
          url: string | null
        }
        Insert: {
          automatic?: boolean
          camera_type?: string | null
          id?: string
          kind?: string | null
          name: string
          reference?: string | null
          residential_id: string
          security_booth_id?: string | null
          status?: boolean
          url?: string | null
        }
        Update: {
          automatic?: boolean
          camera_type?: string | null
          id?: string
          kind?: string | null
          name?: string
          reference?: string | null
          residential_id?: string
          security_booth_id?: string | null
          status?: boolean
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cameras_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cameras_security_booth_id_fkey"
            columns: ["security_booth_id"]
            isOneToOne: false
            referencedRelation: "security_booths"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_plates: {
        Row: {
          employee_id: string
          id: string
          plate_id: string
        }
        Insert: {
          employee_id: string
          id?: string
          plate_id: string
        }
        Update: {
          employee_id?: string
          id?: string
          plate_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_plates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_plates_plate_id_fkey"
            columns: ["plate_id"]
            isOneToOne: false
            referencedRelation: "plates"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_schedules: {
        Row: {
          day: string
          employee_id: string
          id: string
          time_end: string | null
          time_start: string | null
        }
        Insert: {
          day: string
          employee_id: string
          id?: string
          time_end?: string | null
          time_start?: string | null
        }
        Update: {
          day?: string
          employee_id?: string
          id?: string
          time_end?: string | null
          time_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          avatar: string | null
          created_at: string
          credential: string | null
          days: string | null
          deleted: boolean
          face_id: string | null
          folio: string | null
          house_id: string
          id: string
          name: string
          reference: string | null
          status: boolean
          time_end: string | null
          time_start: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          credential?: string | null
          days?: string | null
          deleted?: boolean
          face_id?: string | null
          folio?: string | null
          house_id: string
          id?: string
          name: string
          reference?: string | null
          status?: boolean
          time_end?: string | null
          time_start?: string | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          credential?: string | null
          days?: string | null
          deleted?: boolean
          face_id?: string | null
          folio?: string | null
          house_id?: string
          id?: string
          name?: string
          reference?: string | null
          status?: boolean
          time_end?: string | null
          time_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      event_visitors: {
        Row: {
          event_id: string
          folio: string | null
          id: string
          name: string | null
          visitor_id: string | null
        }
        Insert: {
          event_id: string
          folio?: string | null
          id?: string
          name?: string | null
          visitor_id?: string | null
        }
        Update: {
          event_id?: string
          folio?: string | null
          id?: string
          name?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_visitors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_visitors_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cars: number | null
          created_at: string
          due_date: string | null
          finish_date: string | null
          folio: string | null
          house_id: string | null
          id: string
          name: string
          open: boolean
          qr_url: string | null
          residential_id: string
          space_id: string | null
          user_id: string | null
        }
        Insert: {
          cars?: number | null
          created_at?: string
          due_date?: string | null
          finish_date?: string | null
          folio?: string | null
          house_id?: string | null
          id?: string
          name: string
          open?: boolean
          qr_url?: string | null
          residential_id: string
          space_id?: string | null
          user_id?: string | null
        }
        Update: {
          cars?: number | null
          created_at?: string
          due_date?: string | null
          finish_date?: string | null
          folio?: string | null
          house_id?: string | null
          id?: string
          name?: string
          open?: boolean
          qr_url?: string | null
          residential_id?: string
          space_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      house_plates: {
        Row: {
          graylist: boolean
          house_id: string
          id: string
          plate_id: string
        }
        Insert: {
          graylist?: boolean
          house_id: string
          id?: string
          plate_id: string
        }
        Update: {
          graylist?: boolean
          house_id?: string
          id?: string
          plate_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_plates_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_plates_plate_id_fkey"
            columns: ["plate_id"]
            isOneToOne: false
            referencedRelation: "plates"
            referencedColumns: ["id"]
          },
        ]
      }
      houses: {
        Row: {
          address: string
          block_qr_casual: boolean
          block_qr_employee: boolean
          block_qr_visitor: boolean
          cluster: string | null
          created_at: string
          defaulter: boolean
          defaulter_authorize_visit: boolean
          deleted: boolean
          employee_limit: number | null
          frequently_limit: number | null
          id: string
          kind: Database["public"]["Enums"]["house_kind"]
          paid: boolean
          paid_limit_time: string | null
          paid_start_date: string | null
          phone: string | null
          public_phone: string | null
          resident_limit: number | null
          residential_id: string
          status: boolean
          updated_at: string
          validated: boolean
          visitor_limit: number | null
        }
        Insert: {
          address: string
          block_qr_casual?: boolean
          block_qr_employee?: boolean
          block_qr_visitor?: boolean
          cluster?: string | null
          created_at?: string
          defaulter?: boolean
          defaulter_authorize_visit?: boolean
          deleted?: boolean
          employee_limit?: number | null
          frequently_limit?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["house_kind"]
          paid?: boolean
          paid_limit_time?: string | null
          paid_start_date?: string | null
          phone?: string | null
          public_phone?: string | null
          resident_limit?: number | null
          residential_id: string
          status?: boolean
          updated_at?: string
          validated?: boolean
          visitor_limit?: number | null
        }
        Update: {
          address?: string
          block_qr_casual?: boolean
          block_qr_employee?: boolean
          block_qr_visitor?: boolean
          cluster?: string | null
          created_at?: string
          defaulter?: boolean
          defaulter_authorize_visit?: boolean
          deleted?: boolean
          employee_limit?: number | null
          frequently_limit?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["house_kind"]
          paid?: boolean
          paid_limit_time?: string | null
          paid_start_date?: string | null
          phone?: string | null
          public_phone?: string | null
          resident_limit?: number | null
          residential_id?: string
          status?: boolean
          updated_at?: string
          validated?: boolean
          visitor_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "houses_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          blacklist: boolean
          created_at: string
          id: string
          reason: string | null
          residential_id: string
          user_id: string | null
          visit_id: string | null
        }
        Insert: {
          blacklist?: boolean
          created_at?: string
          id?: string
          reason?: string | null
          residential_id: string
          user_id?: string | null
          visit_id?: string | null
        }
        Update: {
          blacklist?: boolean
          created_at?: string
          id?: string
          reason?: string | null
          residential_id?: string
          user_id?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          created_at: string
          description: string
          file: string | null
          house_id: string | null
          id: string
          kind: Database["public"]["Enums"]["notice_kind"]
          residential_id: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          file?: string | null
          house_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["notice_kind"]
          residential_id: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          file?: string | null
          house_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["notice_kind"]
          residential_id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notices_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notices_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          residential_id: string
          user_id: string | null
          viewed: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          residential_id: string
          user_id?: string | null
          viewed?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          residential_id?: string
          user_id?: string | null
          viewed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notifications_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      panic_alerts: {
        Row: {
          created_at: string
          house_id: string | null
          id: string
          kind: string | null
          lat: number | null
          lng: number | null
          residential_id: string
          saw: string | null
          status: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          house_id?: string | null
          id?: string
          kind?: string | null
          lat?: number | null
          lng?: number | null
          residential_id: string
          saw?: string | null
          status?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          house_id?: string | null
          id?: string
          kind?: string | null
          lat?: number | null
          lng?: number | null
          residential_id?: string
          saw?: string | null
          status?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "panic_alerts_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "panic_alerts_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "panic_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plates: {
        Row: {
          brand: string | null
          class_type: string | null
          color: string | null
          created_at: string
          id: string
          kind: string | null
          list: Database["public"]["Enums"]["plate_list"]
          model: string | null
          number: string
          resident: boolean
          residential_id: string
          state: string | null
          updated_at: string
          year: string | null
        }
        Insert: {
          brand?: string | null
          class_type?: string | null
          color?: string | null
          created_at?: string
          id?: string
          kind?: string | null
          list?: Database["public"]["Enums"]["plate_list"]
          model?: string | null
          number: string
          resident?: boolean
          residential_id: string
          state?: string | null
          updated_at?: string
          year?: string | null
        }
        Update: {
          brand?: string | null
          class_type?: string | null
          color?: string | null
          created_at?: string
          id?: string
          kind?: string | null
          list?: Database["public"]["Enums"]["plate_list"]
          model?: string | null
          number?: string
          resident?: boolean
          residential_id?: string
          state?: string | null
          updated_at?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plates_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          id: string
          logo: string | null
          name: string
          residential_id: string
        }
        Insert: {
          id?: string
          logo?: string | null
          name: string
          residential_id: string
        }
        Update: {
          id?: string
          logo?: string | null
          name?: string
          residential_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "providers_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          authorization_user_id: string | null
          created_at: string
          deny_reason: string | null
          end_date: string
          end_hour: number | null
          id: string
          paid: boolean
          payment_voucher: string | null
          price: number
          qr_code: string | null
          reason: string | null
          residential_id: string
          space_id: string
          start_date: string
          start_hour: number | null
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          authorization_user_id?: string | null
          created_at?: string
          deny_reason?: string | null
          end_date: string
          end_hour?: number | null
          id?: string
          paid?: boolean
          payment_voucher?: string | null
          price?: number
          qr_code?: string | null
          reason?: string | null
          residential_id: string
          space_id: string
          start_date: string
          start_hour?: number | null
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          authorization_user_id?: string | null
          created_at?: string
          deny_reason?: string | null
          end_date?: string
          end_hour?: number | null
          id?: string
          paid?: boolean
          payment_voucher?: string | null
          price?: number
          qr_code?: string | null
          reason?: string | null
          residential_id?: string
          space_id?: string
          start_date?: string
          start_hour?: number | null
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_authorization_user_id_fkey"
            columns: ["authorization_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      residentials: {
        Row: {
          channel: string | null
          company_mode: boolean
          confirmation_wait_time: number
          created_at: string
          facial: boolean
          id: string
          login_fails: number
          login_timeout: number
          logo: string | null
          lpr: boolean
          name: string
          qr_enabled: boolean
          repuve: boolean
          reservations: boolean
          resident_app: boolean
          settings: Json
          status: boolean
          timezone_hours: number
          updated_at: string
          visitor_expiration_time: number | null
        }
        Insert: {
          channel?: string | null
          company_mode?: boolean
          confirmation_wait_time?: number
          created_at?: string
          facial?: boolean
          id?: string
          login_fails?: number
          login_timeout?: number
          logo?: string | null
          lpr?: boolean
          name: string
          qr_enabled?: boolean
          repuve?: boolean
          reservations?: boolean
          resident_app?: boolean
          settings?: Json
          status?: boolean
          timezone_hours?: number
          updated_at?: string
          visitor_expiration_time?: number | null
        }
        Update: {
          channel?: string | null
          company_mode?: boolean
          confirmation_wait_time?: number
          created_at?: string
          facial?: boolean
          id?: string
          login_fails?: number
          login_timeout?: number
          logo?: string | null
          lpr?: boolean
          name?: string
          qr_enabled?: boolean
          repuve?: boolean
          reservations?: boolean
          resident_app?: boolean
          settings?: Json
          status?: boolean
          timezone_hours?: number
          updated_at?: string
          visitor_expiration_time?: number | null
        }
        Relationships: []
      }
      rols: {
        Row: {
          id: string
          name: string
          residential_id: string | null
          status: boolean
        }
        Insert: {
          id?: string
          name: string
          residential_id?: string | null
          status?: boolean
        }
        Update: {
          id?: string
          name?: string
          residential_id?: string | null
          status?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "rols_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
        ]
      }
      security_booths: {
        Row: {
          channel: string | null
          color: string | null
          double_check: boolean
          id: string
          main: boolean
          name: string
          printer: boolean
          residential_id: string
          status: boolean
        }
        Insert: {
          channel?: string | null
          color?: string | null
          double_check?: boolean
          id?: string
          main?: boolean
          name: string
          printer?: boolean
          residential_id: string
          status?: boolean
        }
        Update: {
          channel?: string | null
          color?: string | null
          double_check?: boolean
          id?: string
          main?: boolean
          name?: string
          printer?: boolean
          residential_id?: string
          status?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "security_booths_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          has_details: boolean
          id: string
          name: string
          residential_id: string
          status: boolean
        }
        Insert: {
          has_details?: boolean
          id?: string
          name: string
          residential_id: string
          status?: boolean
        }
        Update: {
          has_details?: boolean
          id?: string
          name?: string
          residential_id?: string
          status?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "services_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          created_at: string
          deposit: number
          facial_access: boolean
          guests_limit: number | null
          id: string
          name: string
          pay: boolean
          price: number
          qr_access: boolean
          reservation_future_limit: number | null
          reservation_limit: number | null
          residential_id: string
          status: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit?: number
          facial_access?: boolean
          guests_limit?: number | null
          id?: string
          name: string
          pay?: boolean
          price?: number
          qr_access?: boolean
          reservation_future_limit?: number | null
          reservation_limit?: number | null
          residential_id: string
          status?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit?: number
          facial_access?: boolean
          guests_limit?: number | null
          id?: string
          name?: string
          pay?: boolean
          price?: number
          qr_access?: boolean
          reservation_future_limit?: number | null
          reservation_limit?: number | null
          residential_id?: string
          status?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          car: string | null
          id: string
          kind: string | null
          plates: string | null
          residential_id: string
          status: boolean
          tag_number: string
          user_id: string | null
        }
        Insert: {
          car?: string | null
          id?: string
          kind?: string | null
          plates?: string | null
          residential_id: string
          status?: boolean
          tag_number: string
          user_id?: string | null
        }
        Update: {
          car?: string | null
          id?: string
          kind?: string | null
          plates?: string | null
          residential_id?: string
          status?: boolean
          tag_number?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_categories: {
        Row: {
          id: string
          name: string
          residential_id: string
          status: boolean
        }
        Insert: {
          id?: string
          name: string
          residential_id: string
          status?: boolean
        }
        Update: {
          id?: string
          name?: string
          residential_id?: string
          status?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ticket_categories_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_responses: {
        Row: {
          created_at: string
          id: string
          message: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          residential_id: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_category_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          residential_id: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_category_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          residential_id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_category_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_category_id_fkey"
            columns: ["ticket_category_id"]
            isOneToOne: false
            referencedRelation: "ticket_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transports: {
        Row: {
          id: string
          name: string
          plates: boolean
          residential_id: string
          status: boolean
        }
        Insert: {
          id?: string
          name: string
          plates?: boolean
          residential_id: string
          status?: boolean
        }
        Update: {
          id?: string
          name?: string
          plates?: boolean
          residential_id?: string
          status?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "transports_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          alocity_user_id: string | null
          auth_user_id: string | null
          avatar: string | null
          axis_id: string | null
          created_at: string
          email: string | null
          email_activation: boolean
          face_id: string | null
          hikvision_id: string | null
          house_id: string | null
          id: string
          name: string
          phone: string | null
          qr_code: string | null
          representative: boolean
          residential_id: string
          rol_id: string | null
          status: boolean
          super: boolean
          updated_at: string
          username: string | null
          validated: boolean
          zk_id: string | null
        }
        Insert: {
          alocity_user_id?: string | null
          auth_user_id?: string | null
          avatar?: string | null
          axis_id?: string | null
          created_at?: string
          email?: string | null
          email_activation?: boolean
          face_id?: string | null
          hikvision_id?: string | null
          house_id?: string | null
          id?: string
          name: string
          phone?: string | null
          qr_code?: string | null
          representative?: boolean
          residential_id: string
          rol_id?: string | null
          status?: boolean
          super?: boolean
          updated_at?: string
          username?: string | null
          validated?: boolean
          zk_id?: string | null
        }
        Update: {
          alocity_user_id?: string | null
          auth_user_id?: string | null
          avatar?: string | null
          axis_id?: string | null
          created_at?: string
          email?: string | null
          email_activation?: boolean
          face_id?: string | null
          hikvision_id?: string | null
          house_id?: string | null
          id?: string
          name?: string
          phone?: string | null
          qr_code?: string | null
          representative?: boolean
          residential_id?: string
          rol_id?: string | null
          status?: boolean
          super?: boolean
          updated_at?: string
          username?: string | null
          validated?: boolean
          zk_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "rols"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_photos: {
        Row: {
          created_at: string
          id: string
          url: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          url: string
          visit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          url?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_photos_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_houses: {
        Row: {
          created_at: string
          face_id: string | null
          frequently: boolean
          frequently_code: string | null
          house_id: string
          id: string
          qr_code: string | null
          status: boolean
          unexpected: boolean
          visitor_id: string
        }
        Insert: {
          created_at?: string
          face_id?: string | null
          frequently?: boolean
          frequently_code?: string | null
          house_id: string
          id?: string
          qr_code?: string | null
          status?: boolean
          unexpected?: boolean
          visitor_id: string
        }
        Update: {
          created_at?: string
          face_id?: string | null
          frequently?: boolean
          frequently_code?: string | null
          house_id?: string
          id?: string
          qr_code?: string | null
          status?: boolean
          unexpected?: boolean
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_houses_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_houses_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_plates: {
        Row: {
          id: string
          plate_id: string
          visitor_id: string
        }
        Insert: {
          id?: string
          plate_id: string
          visitor_id: string
        }
        Update: {
          id?: string
          plate_id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_plates_plate_id_fkey"
            columns: ["plate_id"]
            isOneToOne: false
            referencedRelation: "plates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_plates_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          amenity: boolean
          avatar: string | null
          company: string | null
          created_at: string
          credential: string | null
          curp: string | null
          deleted: boolean
          face_id: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          residential_id: string
          rol_id: string | null
          status: boolean
          updated_at: string
        }
        Insert: {
          amenity?: boolean
          avatar?: string | null
          company?: string | null
          created_at?: string
          credential?: string | null
          curp?: string | null
          deleted?: boolean
          face_id?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          residential_id: string
          rol_id?: string | null
          status?: boolean
          updated_at?: string
        }
        Update: {
          amenity?: boolean
          avatar?: string | null
          company?: string | null
          created_at?: string
          credential?: string | null
          curp?: string | null
          deleted?: boolean
          face_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          residential_id?: string
          rol_id?: string | null
          status?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitors_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "rols"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          access_kind: string | null
          access_user_id: string | null
          arrive_date: string | null
          created_at: string
          created_by: string | null
          details: string | null
          due_date: string | null
          employee_id: string | null
          enter_date: string | null
          event_id: string | null
          folio: string | null
          guard_report: boolean
          house_id: string | null
          id: string
          kind: Database["public"]["Enums"]["visit_kind"]
          leave_date: string | null
          leave_user_id: string | null
          notes: string | null
          permanence: number | null
          plate_id: string | null
          private: boolean
          provider_id: string | null
          quick: boolean
          reason: string | null
          residential_id: string
          security_booth_id: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["visit_status"]
          subject: string | null
          tag_id: string | null
          transport_id: string | null
          updated_at: string
          validity: number | null
          visitor_id: string | null
        }
        Insert: {
          access_kind?: string | null
          access_user_id?: string | null
          arrive_date?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          due_date?: string | null
          employee_id?: string | null
          enter_date?: string | null
          event_id?: string | null
          folio?: string | null
          guard_report?: boolean
          house_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["visit_kind"]
          leave_date?: string | null
          leave_user_id?: string | null
          notes?: string | null
          permanence?: number | null
          plate_id?: string | null
          private?: boolean
          provider_id?: string | null
          quick?: boolean
          reason?: string | null
          residential_id: string
          security_booth_id?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          subject?: string | null
          tag_id?: string | null
          transport_id?: string | null
          updated_at?: string
          validity?: number | null
          visitor_id?: string | null
        }
        Update: {
          access_kind?: string | null
          access_user_id?: string | null
          arrive_date?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          due_date?: string | null
          employee_id?: string | null
          enter_date?: string | null
          event_id?: string | null
          folio?: string | null
          guard_report?: boolean
          house_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["visit_kind"]
          leave_date?: string | null
          leave_user_id?: string | null
          notes?: string | null
          permanence?: number | null
          plate_id?: string | null
          private?: boolean
          provider_id?: string | null
          quick?: boolean
          reason?: string | null
          residential_id?: string
          security_booth_id?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          subject?: string | null
          tag_id?: string | null
          transport_id?: string | null
          updated_at?: string
          validity?: number | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_access_user_id_fkey"
            columns: ["access_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_leave_user_id_fkey"
            columns: ["leave_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_plate_id_fkey"
            columns: ["plate_id"]
            isOneToOne: false
            referencedRelation: "plates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_residential_id_fkey"
            columns: ["residential_id"]
            isOneToOne: false
            referencedRelation: "residentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_security_booth_id_fkey"
            columns: ["security_booth_id"]
            isOneToOne: false
            referencedRelation: "security_booths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_transport_id_fkey"
            columns: ["transport_id"]
            isOneToOne: false
            referencedRelation: "transports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_is_admin: { Args: never; Returns: boolean }
      current_residential_id: { Args: never; Returns: string }
    }
    Enums: {
      house_kind: "land" | "construction" | "build" | "inhabited" | "rent"
      notice_kind: "general" | "house" | "emergency" | "payment"
      plate_list: "none" | "blacklist" | "graylist" | "report" | "recuperate"
      reservation_status:
        | "pending"
        | "authorized"
        | "denied"
        | "canceled"
        | "finished"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      visit_kind:
        | "visitor"
        | "employee"
        | "service"
        | "resident"
        | "provider"
        | "event"
      visit_status:
        | "pending"
        | "authorized"
        | "denied"
        | "inside"
        | "finished"
        | "canceled"
        | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      house_kind: ["land", "construction", "build", "inhabited", "rent"],
      notice_kind: ["general", "house", "emergency", "payment"],
      plate_list: ["none", "blacklist", "graylist", "report", "recuperate"],
      reservation_status: [
        "pending",
        "authorized",
        "denied",
        "canceled",
        "finished",
      ],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      visit_kind: [
        "visitor",
        "employee",
        "service",
        "resident",
        "provider",
        "event",
      ],
      visit_status: [
        "pending",
        "authorized",
        "denied",
        "inside",
        "finished",
        "canceled",
        "expired",
      ],
    },
  },
} as const
