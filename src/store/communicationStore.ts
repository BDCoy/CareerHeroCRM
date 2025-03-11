import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Communication } from '../types';
import { sendEmail, sendSMS, sendWhatsApp } from '../lib/api';
import { supabase } from '../lib/supabase';

interface CommunicationState {
  communications: Communication[];
  loading: boolean;
  error: string | null;
  fetchAllCommunications: () => Promise<void>;
  fetchCommunications: (customerId: string) => Promise<void>;
  fetchCommunicationsByStatus: (status: string) => Promise<Communication[]>;
  softDeleteCommunication: (id: string) => Promise<void>;
  sendEmail: (to: string, subject: string, body: string, customerId: string) => Promise<void>;
  sendSMS: (to: string, body: string, customerId: string) => Promise<void>;
  sendWhatsApp: (to: string, body: string, customerId: string) => Promise<void>;
  clearError: () => void;
}

export const useCommunicationStore = create<CommunicationState>()(
  persist(
    (set, get) => ({
      communications: [],
      loading: false,
      error: null,
      
      clearError: () => set({ error: null }),
      
      fetchAllCommunications: async () => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('communications')
            .select('*')
            .order('sentat', { ascending: false });
          
          if (error) throw error;
          
          set({ 
            communications: data || [], 
            loading: false 
          });
        } catch (error) {
          console.error('Error fetching communications:', error);
          set({ 
            error: (error as Error).message || 'Failed to fetch communications', 
            loading: false,
            communications: []
          });
        }
      },

      fetchCommunications: async (customerId: string) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('communications')
            .select('*')
            .eq('customerid', customerId)
            .order('sentat', { ascending: false });
          
          if (error) throw error;
          
          set({ 
            communications: data || [], 
            loading: false 
          });
        } catch (error) {
          console.error('Error fetching customer communications:', error);
          set({ 
            error: (error as Error).message || 'Failed to fetch communications', 
            loading: false,
            communications: []
          });
        }
      },

      fetchCommunicationsByStatus: async (status: string) => {
        try {
          const { data, error } = await supabase
            .from('communications')
            .select('*')
            .eq('status', status)
            .order('sentat', { ascending: false });
          
          if (error) throw error;
          return data || [];
        } catch (error) {
          console.error('Error fetching communications by status:', error);
          throw error;
        }
      },

      softDeleteCommunication: async (id: string) => {
        try {
          const { error } = await supabase
            .from('communications')
            .update({ status: 'deleted' })
            .eq('id', id);

          if (error) throw error;

          // Update local state
          set(state => ({
            communications: state.communications.map(comm => 
              comm.id === id ? { ...comm, status: 'deleted' } : comm
            )
          }));
        } catch (error) {
          console.error('Error soft deleting communication:', error);
          throw error;
        }
      },
      
      sendEmail: async (to: string, subject: string, body: string, customerId: string) => {
        set({ loading: true, error: null });
        try {
          const result = await sendEmail(to, subject, body, customerId);
          
          set(state => ({ 
            communications: [result.communication, ...state.communications],
            loading: false 
          }));
        } catch (error) {
          console.error('Error sending email:', error);
          set({ 
            error: (error as Error).message || 'Failed to send email', 
            loading: false 
          });
          throw error;
        }
      },
      
      sendSMS: async (to: string, body: string, customerId: string) => {
        set({ loading: true, error: null });
        try {
          const communication = await sendSMS(to, body, customerId, 'sms');
          
          set(state => ({ 
            communications: [communication, ...state.communications],
            loading: false 
          }));
        } catch (error) {
          console.error('Error sending SMS:', error);
          set({ 
            error: (error as Error).message || 'Failed to send SMS', 
            loading: false 
          });
          throw error;
        }
      },
      
      sendWhatsApp: async (to: string, body: string, customerId: string) => {
        set({ loading: true, error: null });
        try {
          const communication = await sendWhatsApp(to, body, customerId);
          
          set(state => ({ 
            communications: [communication, ...state.communications],
            loading: false 
          }));
        } catch (error) {
          console.error('Error sending WhatsApp message:', error);
          set({ 
            error: (error as Error).message || 'Failed to send WhatsApp message', 
            loading: false 
          });
          throw error;
        }
      }
    }),
    {
      name: 'communication-storage',
      partialize: (state) => ({ 
        communications: state.communications,
      }),
    }
  )
);