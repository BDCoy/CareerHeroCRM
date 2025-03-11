import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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

// Custom storage that implements size limits and data cleanup
const createCustomStorage = () => {
  const storage = createJSONStorage(() => localStorage);
  
  return {
    ...storage,
    setItem: (key: string, value: string) => {
      try {
        // Clean up customer data before storing
        const data = JSON.parse(value);
        if (data.state && Array.isArray(data.state.customers)) {
          // Only store essential customer data
          data.state.customers = data.state.customers.map((customer: Customer) => ({
            id: customer.id,
            firstname: customer.firstname,
            lastname: customer.lastname,
            email: customer.email,
            phone: customer.phone,
            status: customer.status,
            createdat: customer.createdat,
            updatedat: customer.updatedat
          }));
          
          // Limit the number of stored customers
          data.state.customers = data.state.customers.slice(0, 100);
          
          // Remove selectedCustomer from storage
          data.state.selectedCustomer = null;
        }
        
        // Try to store the cleaned data
        const cleanedValue = JSON.stringify(data);
        try {
          localStorage.setItem(key, cleanedValue);
        } catch (storageError) {
          // If still exceeding quota, remove more data
          if (storageError.name === 'QuotaExceededError') {
            data.state.customers = data.state.customers.slice(0, 50);
            localStorage.setItem(key, JSON.stringify(data));
          } else {
            throw storageError;
          }
        }
      } catch (error) {
        console.error('Error storing customer data:', error);
        // If all else fails, clear storage and store minimal data
        localStorage.clear();
        const minimalData = {
          state: {
            customers: [],
            selectedCustomer: null,
            loading: false,
            error: null
          }
        };
        localStorage.setItem(key, JSON.stringify(minimalData));
      }
    },
    getItem: storage.getItem,
    removeItem: storage.removeItem
  };
};

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
          const customers = await getCustomers();
          set({ customers, loading: false });
        } catch (error) {
          console.error('Error fetching customers:', error);
          
          if (get().customers.length === 0) {
            // Create mock data only if no customers exist
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
          const existingCustomer = get().customers.find(c => c.id === id);
          
          if (existingCustomer) {
            set({ selectedCustomer: existingCustomer, loading: false });
            return;
          }
          
          try {
            const customer = await getCustomer(id);
            if (customer) {
              set({ selectedCustomer: customer, loading: false });
            } else {
              set({ error: 'Customer not found', loading: false });
            }
          } catch (apiError) {
            console.error('Error fetching customer from API:', apiError);
            
            if (get().error && get().error.includes('demo data')) {
              const mockCustomer: Customer = {
                id,
                firstname: 'Demo',
                lastname: 'Customer',
                email: 'demo.customer@example.com',
                phone: '+1 (555) 123-4567',
                status: 'customer',
                source: 'Demo',
                notes: 'This is a demo customer.',
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
          const newCustomer = await createCustomer(customer);
          set(state => ({ 
            customers: [newCustomer, ...state.customers],
            loading: false 
          }));
          return newCustomer;
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
          const updatedCustomer = await updateCustomer(id, updates);
          set(state => ({
            customers: state.customers.map(c => c.id === id ? updatedCustomer : c),
            selectedCustomer: state.selectedCustomer?.id === id ? updatedCustomer : state.selectedCustomer,
            loading: false
          }));
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
          await deleteCustomer(id);
          set(state => ({
            customers: state.customers.filter(c => c.id !== id),
            selectedCustomer: state.selectedCustomer?.id === id ? null : state.selectedCustomer,
            loading: false
          }));
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
      storage: createCustomStorage(),
      partialize: (state) => ({
        customers: state.customers.map(customer => ({
          id: customer.id,
          firstname: customer.firstname,
          lastname: customer.lastname,
          email: customer.email,
          phone: customer.phone,
          status: customer.status,
          createdat: customer.createdat,
          updatedat: customer.updatedat
        }))
      })
    }
  )
);