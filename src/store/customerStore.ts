import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Customer } from '../types';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../lib/api';

interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  loading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  fetchCustomer: (id: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdat' | 'updatedat'>) => Promise<Customer>;
  editCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  removeCustomer: (id: string) => Promise<void>;
  setSelectedCustomer: (customer: Customer | null) => void;
  clearError: () => void;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      selectedCustomer: null,
      loading: false,
      error: null,
      
      clearError: () => set({ error: null }),
      
      fetchCustomers: async () => {
        set({ loading: true, error: null });
        try {
          // First try to get customers from the API
          const customers = await getCustomers();
          set({ customers, loading: false });
        } catch (error) {
          console.error('Error fetching customers:', error);
          
          // If we have customers in the store already, keep them
          if (get().customers.length === 0) {
            // If no customers in store, create some mock data for demo purposes
            const mockCustomers: Customer[] = [
              {
                id: '642620a2-d533-4091-84ad-fbc95b96a85e',
                firstname: 'John',
                lastname: 'Doe',
                email: 'john.doe@example.com',
                phone: '+1 (555) 123-4567',
                status: 'customer',
                source: 'Website',
                notes: 'Interested in our premium plan',
                createdat: new Date().toISOString(),
                updatedat: new Date().toISOString()
              },
              {
                id: '7f8d3a9c-e214-4b12-9c2b-d3f5e7a8b9c0',
                firstname: 'Jane',
                lastname: 'Smith',
                email: 'jane.smith@example.com',
                phone: '+1 (555) 987-6543',
                status: 'lead',
                source: 'Referral',
                notes: 'Contacted us about the basic plan',
                createdat: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                updatedat: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                id: 'a1b2c3d4-e5f6-4a5b-9c8d-7e6f5a4b3c2',
                firstname: 'Michael',
                lastname: 'Johnson',
                email: 'michael.johnson@example.com',
                phone: '+1 (555) 456-7890',
                status: 'prospect',
                source: 'LinkedIn',
                notes: 'Had a demo call on March 15',
                createdat: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                updatedat: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
              }
            ];
            
            set({ 
              customers: mockCustomers, 
              loading: false,
              error: 'Could not connect to database. Using demo data instead.'
            });
          } else {
            set({ 
              error: (error as Error).message || 'Failed to fetch customers', 
              loading: false 
            });
          }
        }
      },
      
      fetchCustomer: async (id: string) => {
        set({ loading: true, error: null });
        try {
          // First check if we already have this customer in the store
          const existingCustomer = get().customers.find(c => c.id === id);
          
          if (existingCustomer) {
            set({ selectedCustomer: existingCustomer, loading: false });
            return;
          }
          
          // If not, fetch from API
          try {
            const customer = await getCustomer(id);
            if (customer) {
              set({ selectedCustomer: customer, loading: false });
            } else {
              set({ error: 'Customer not found', loading: false });
            }
          } catch (apiError) {
            console.error('Error fetching customer from API:', apiError);
            
            // If we're in demo mode, create a mock customer
            if (get().error && get().error.includes('demo data')) {
              const mockCustomer: Customer = {
                id,
                firstname: 'Demo',
                lastname: 'Customer',
                email: 'demo.customer@example.com',
                phone: '+1 (555) 123-4567',
                status: 'customer',
                source: 'Demo',
                notes: 'This is a demo customer created because the database connection failed.',
                createdat: new Date().toISOString(),
                updatedat: new Date().toISOString()
              };
              
              set({ selectedCustomer: mockCustomer, loading: false });
            } else {
              throw apiError;
            }
          }
        } catch (error) {
          console.error('Error fetching customer:', error);
          set({ 
            error: (error as Error).message || 'Failed to fetch customer', 
            loading: false 
          });
        }
      },
      
      addCustomer: async (customer) => {
        set({ loading: true, error: null });
        try {
          // Try to create the customer via API
          try {
            const newCustomer = await createCustomer(customer);
            
            // Update the customers list with the new customer
            set(state => ({ 
              customers: [newCustomer, ...state.customers],
              loading: false 
            }));
            
            return newCustomer;
          } catch (apiError) {
            console.error('Error adding customer via API:', apiError);
            
            // If we're in demo mode, create a mock customer
            if (get().error && get().error.includes('demo data')) {
              const mockCustomer: Customer = {
                id: uuidv4(),
                ...customer,
                createdat: new Date().toISOString(),
                updatedat: new Date().toISOString()
              };
              
              // Update the customers list with the new mock customer
              set(state => ({ 
                customers: [mockCustomer, ...state.customers],
                loading: false 
              }));
              
              return mockCustomer;
            } else {
              throw apiError;
            }
          }
        } catch (error) {
          console.error('Error adding customer:', error);
          set({ 
            error: (error as Error).message || 'Failed to add customer', 
            loading: false 
          });
          throw error;
        }
      },
      
      editCustomer: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          // Try to update the customer via API
          try {
            const updatedCustomer = await updateCustomer(id, updates);
            
            // Update both the customers list and selectedCustomer if it's the same one
            set(state => ({
              customers: state.customers.map(c => c.id === id ? updatedCustomer : c),
              selectedCustomer: state.selectedCustomer?.id === id ? updatedCustomer : state.selectedCustomer,
              loading: false
            }));
          } catch (apiError) {
            console.error('Error updating customer via API:', apiError);
            
            // If we're in demo mode, update the customer locally
            if (get().error && get().error.includes('demo data')) {
              // Find the customer in the store
              const customer = get().customers.find(c => c.id === id);
              
              if (customer) {
                const updatedCustomer: Customer = {
                  ...customer,
                  ...updates,
                  updatedat: new Date().toISOString()
                };
                
                // Update both the customers list and selectedCustomer if it's the same one
                set(state => ({
                  customers: state.customers.map(c => c.id === id ? updatedCustomer : c),
                  selectedCustomer: state.selectedCustomer?.id === id ? updatedCustomer : state.selectedCustomer,
                  loading: false
                }));
              } else {
                throw new Error('Customer not found');
              }
            } else {
              throw apiError;
            }
          }
        } catch (error) {
          console.error('Error updating customer:', error);
          set({ 
            error: (error as Error).message || 'Failed to update customer', 
            loading: false 
          });
        }
      },
      
      removeCustomer: async (id) => {
        set({ loading: true, error: null });
        try {
          // Try to delete the customer via API
          try {
            await deleteCustomer(id);
            
            // Remove the customer from the store
            set(state => ({
              customers: state.customers.filter(c => c.id !== id),
              selectedCustomer: state.selectedCustomer?.id === id ? null : state.selectedCustomer,
              loading: false
            }));
          } catch (apiError) {
            console.error('Error removing customer via API:', apiError);
            
            // If we're in demo mode, remove the customer locally
            if (get().error && get().error.includes('demo data')) {
              // Remove the customer from the store
              set(state => ({
                customers: state.customers.filter(c => c.id !== id),
                selectedCustomer: state.selectedCustomer?.id === id ? null : state.selectedCustomer,
                loading: false
              }));
            } else {
              throw apiError;
            }
          }
        } catch (error) {
          console.error('Error removing customer:', error);
          set({ 
            error: (error as Error).message || 'Failed to remove customer', 
            loading: false 
          });
        }
      },
      
      setSelectedCustomer: (customer) => {
        set({ selectedCustomer: customer });
      }
    }),
    {
      name: 'customer-storage',
      partialize: (state) => ({ 
        customers: state.customers,
        // Don't persist loading or error states
      }),
    }
  )
);

// Helper function for generating UUIDs in demo mode
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}