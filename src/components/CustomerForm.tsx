import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Customer } from '../types';

interface CustomerFormProps {
  initialData?: Partial<Customer>;
  onSubmit: (data: Omit<Customer, 'id' | 'createdat' | 'updatedat'>) => void;
  isLoading?: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ initialData = {}, onSubmit, isLoading = false }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<Omit<Customer, 'id' | 'createdat' | 'updatedat'>>({
    defaultValues: {
      firstname: initialData.firstname || '',
      lastname: initialData.lastname || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      status: initialData.status || 'lead',
      source: initialData.source || '',
      notes: initialData.notes || '',
    }
  });
  
  // Update form values when initialData changes
  useEffect(() => {
    console.log("Initial data changed:", initialData);
    if (initialData) {
      // Use setValue for each field to ensure the form updates properly
      if (initialData.firstname) setValue('firstname', initialData.firstname);
      if (initialData.lastname) setValue('lastname', initialData.lastname);
      if (initialData.email) setValue('email', initialData.email);
      if (initialData.phone) setValue('phone', initialData.phone);
      if (initialData.status) setValue('status', initialData.status);
      if (initialData.source) setValue('source', initialData.source);
      if (initialData.notes) setValue('notes', initialData.notes);
    }
  }, [initialData, setValue]);
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            id="firstname"
            type="text"
            {...register('firstname', { required: 'First name is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.firstname && <p className="mt-1 text-sm text-red-600">{errors.firstname.message}</p>}
        </div>
        
        <div>
          <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">Last Name</label>
          <input
            id="lastname"
            type="text"
            {...register('lastname', { required: 'Last name is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.lastname && <p className="mt-1 text-sm text-red-600">{errors.lastname.message}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            id="phone"
            type="tel"
            {...register('phone', { required: 'Phone number is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            {...register('status', { required: 'Status is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="lead">Lead</option>
            <option value="prospect">Prospect</option>
            <option value="customer">Customer</option>
            <option value="inactive">Inactive</option>
          </select>
          {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
        </div>
        
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700">Source</label>
          <input
            id="source"
            type="text"
            {...register('source')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          id="notes"
          rows={4}
          {...register('notes')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Customer'}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;