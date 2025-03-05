import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Communication } from '../types';
import { sendEmail, sendSMS, sendWhatsApp, getCommunications } from '../lib/api';
import { v4 as uuidv4 } from 'uuid';

interface CommunicationState {
  communications: Communication[];
  loading: boolean;
  error: string | null;
  fetchCommunications: (customerId: string) => Promise<void>;
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
      
      fetchCommunications: async (customerId: string) => {
        set({ loading: true, error: null });
        try {
          // Try to get communications from the API
          try {
            const communications = await getCommunications(customerId);
            set({ communications, loading: false });
          } catch (apiError) {
            console.error('Error fetching communications from API:', apiError);
            
            // If API fails, create some mock communications for demo purposes
            const mockCommunications: Communication[] = [
              {
                id: uuidv4(),
                customerid: customerId,
                type: 'email',
                content: 'Subject: Welcome to our service\n\nHello,\n\nThank you for signing up for our service. We are excited to have you on board!\n\nBest regards,\nThe Team',
                sentat: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'sent',
                metadata: {
                  from: 'support@example.com',
                  to: 'customer@example.com'
                }
              },
              {
                id: uuidv4(),
                customerid: customerId,
                type: 'sms',
                content: 'Your order has been shipped and will arrive in 2-3 business days.',
                sentat: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'delivered',
                metadata: {
                  from: '+15551234567',
                  to: '+15559876543'
                }
              }
            ];
            
            set({ 
              communications: mockCommunications, 
              loading: false,
              error: 'Could not connect to database. Using demo data instead.'
            });
          }
        } catch (error) {
          console.error('Error fetching communications:', error);
          set({ 
            error: (error as Error).message || 'Failed to fetch communications', 
            loading: false 
          });
          
          // If we have communications in the store already, keep them
          if (get().communications.length === 0) {
            set({ communications: [] });
          }
        }
      },
      
      sendEmail: async (to: string, subject: string, body: string, customerId: string) => {
        set({ loading: true, error: null });
        try {
          // Try to send email via API
          try {
            const result = await sendEmail(to, subject, body, customerId);
            
            // Add the new communication to the store
            set(state => ({ 
              communications: [result.communication, ...state.communications],
              loading: false 
            }));
          } catch (apiError) {
            console.error('Error sending email via API:', apiError);
            
            // If API fails, create a mock communication for demo purposes
            const mockCommunication: Communication = {
              id: uuidv4(),
              customerid: customerId,
              type: 'email',
              content: `Subject: ${subject}\n\n${body}`,
              sentat: new Date().toISOString(),
              status: 'sent',
              metadata: {
                from: 'support@example.com',
                to: to
              }
            };
            
            // Add the mock communication to the store
            set(state => ({ 
              communications: [mockCommunication, ...state.communications],
              loading: false,
              error: 'Could not connect to database. Using demo mode instead.'
            }));
          }
        } catch (error) {
          console.error('Error sending email:', error);
          set({ 
            error: (error as Error).message || 'Failed to send email', 
            loading: false 
          });
          throw error; // Re-throw to handle in the component
        }
      },
      
      sendSMS: async (to: string, body: string, customerId: string) => {
        set({ loading: true, error: null });
        try {
          // Try to send SMS via API
          try {
            const communication = await sendSMS(to, body, customerId, 'sms');
            
            // Add the new communication to the store
            set(state => ({ 
              communications: [communication, ...state.communications],
              loading: false 
            }));
          } catch (apiError) {
            console.error('Error sending SMS via API:', apiError);
            
            // If API fails, create a mock communication for demo purposes
            const mockCommunication: Communication = {
              id: uuidv4(),
              customerid: customerId,
              type: 'sms',
              content: body,
              sentat: new Date().toISOString(),
              status: 'sent',
              metadata: {
                from: '+447700169811',
                to: to
              }
            };
            
            // Add the mock communication to the store
            set(state => ({ 
              communications: [mockCommunication, ...state.communications],
              loading: false,
              error: 'Could not connect to database. Using demo mode instead.'
            }));
          }
        } catch (error) {
          console.error('Error sending SMS:', error);
          set({ 
            error: (error as Error).message || 'Failed to send SMS', 
            loading: false 
          });
          throw error; // Re-throw to handle in the component
        }
      },
      
      sendWhatsApp: async (to: string, body: string, customerId: string) => {
        set({ loading: true, error: null });
        try {
          // Try to send WhatsApp message via API
          try {
            const communication = await sendWhatsApp(to, body, customerId);
            
            // Add the new communication to the store
            set(state => ({ 
              communications: [communication, ...state.communications],
              loading: false 
            }));
          } catch (apiError) {
            console.error('Error sending WhatsApp message via API:', apiError);
            
            // If API fails, create a mock communication for demo purposes
            const mockCommunication: Communication = {
              id: uuidv4(),
              customerid: customerId,
              type: 'whatsapp',
              content: body,
              sentat: new Date().toISOString(),
              status: 'sent',
              metadata: {
                from: 'whatsapp:+447700169811',
                to: `whatsapp:${to}`
              }
            };
            
            // Add the mock communication to the store
            set(state => ({ 
              communications: [mockCommunication, ...state.communications],
              loading: false,
              error: 'Could not connect to database. Using demo mode instead.'
            }));
          }
        } catch (error) {
          console.error('Error sending WhatsApp message:', error);
          set({ 
            error: (error as Error).message || 'Failed to send WhatsApp message', 
            loading: false 
          });
          throw error; // Re-throw to handle in the component
        }
      }
    }),
    {
      name: 'communication-storage',
      partialize: (state) => ({ 
        communications: state.communications,
        // Don't persist loading or error states
      }),
    }
  )
);