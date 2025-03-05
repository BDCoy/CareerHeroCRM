import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, Send, AlertCircle, Users, X } from 'lucide-react';
import { useCustomerStore } from '../store/customerStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { sendEmail, sendSMS, sendWhatsApp } from '../lib/api';
import { Customer } from '../types';

interface BulkMessageFormData {
  subject?: string;
  body: string;
}

const BulkCommunication: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const customerIds = searchParams.get('customers')?.split(',') || [];
  const action = searchParams.get('action') as 'email' | 'sms' | 'whatsapp' || 'email';
  
  const { customers, fetchCustomers } = useCustomerStore();
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [phoneErrors, setPhoneErrors] = useState<Record<string, string>>({});
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<BulkMessageFormData>();
  
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  
  useEffect(() => {
    if (customers.length > 0 && customerIds.length > 0) {
      const filtered = customers.filter(customer => customerIds.includes(customer.id));
      setSelectedCustomers(filtered);
      
      // Validate phone numbers for WhatsApp
      if (action === 'whatsapp' || action === 'sms') {
        const errors: Record<string, string> = {};
        filtered.forEach(customer => {
          if (!customer.phone) {
            errors[customer.id] = 'No phone number';
          } else if (action === 'whatsapp' && !validatePhoneForWhatsApp(customer.phone)) {
            errors[customer.id] = 'Invalid WhatsApp number';
          }
        });
        setPhoneErrors(errors);
      }
    }
  }, [customers, customerIds, action]);
  
  // Validate phone number for WhatsApp
  const validatePhoneForWhatsApp = (phone: string): boolean => {
    // Remove all non-digit characters except the plus sign
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Check if it has enough digits for a valid phone number
    if (cleaned.length < 10) {
      return false;
    }
    
    // Check if it has a country code (starts with + or has enough digits)
    if (!cleaned.startsWith('+') && cleaned.length < 11) {
      return false;
    }
    
    return true;
  };
  
  const removeCustomer = (customerId: string) => {
    setSelectedCustomers(prev => prev.filter(c => c.id !== customerId));
    
    // Update the URL to reflect the change
    const newCustomerIds = customerIds.filter(id => id !== customerId);
    navigate(`/bulk-communication?customers=${newCustomerIds.join(',')}&action=${action}`);
  };
  
  const onSubmit = async (data: BulkMessageFormData) => {
    if (selectedCustomers.length === 0) {
      toast.error('No customers selected');
      return;
    }
    
    setIsSending(true);
    setProgress({ current: 0, total: selectedCustomers.length, success: 0, failed: 0 });
    
    try {
      // Process each customer
      for (let i = 0; i < selectedCustomers.length; i++) {
        const customer = selectedCustomers[i];
        setProgress(prev => ({ ...prev, current: i + 1 }));
        
        try {
          if (action === 'email') {
            if (!data.subject) {
              throw new Error('Subject is required for emails');
            }
            await sendEmail(customer.email, data.subject, data.body, customer.id);
          } else if (action === 'sms') {
            if (!customer.phone) {
              throw new Error('No phone number');
            }
            await sendSMS(customer.phone, data.body, customer.id);
          } else if (action === 'whatsapp') {
            if (!customer.phone) {
              throw new Error('No phone number');
            }
            if (!validatePhoneForWhatsApp(customer.phone)) {
              throw new Error('Invalid WhatsApp number');
            }
            await sendWhatsApp(customer.phone, data.body, customer.id);
          }
          
          setProgress(prev => ({ ...prev, success: prev.success + 1 }));
        } catch (error) {
          console.error(`Error sending to ${customer.email}:`, error);
          setProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
        }
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      toast.success(`Successfully sent to ${progress.success} customers`);
    } catch (error) {
      console.error('Error in bulk send:', error);
      toast.error('Error sending messages');
    } finally {
      setIsSending(false);
    }
  };
  
  const getActionIcon = () => {
    switch (action) {
      case 'email':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'sms':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case 'whatsapp':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-green-500" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        );
      default:
        return <Mail className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getActionColor = () => {
    switch (action) {
      case 'email':
        return 'text-blue-600';
      case 'sms':
        return 'text-purple-600';
      case 'whatsapp':
        return 'text-green-600';
      default:
        return 'text-blue-600';
    }
  };
  
  const getActionButtonColor = () => {
    switch (action) {
      case 'email':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      case 'sms':
        return 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500';
      case 'whatsapp':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  };
  
  const getActionName = () => {
    switch (action) {
      case 'email':
        return 'Email';
      case 'sms':
        return 'SMS';
      case 'whatsapp':
        return 'WhatsApp';
      default:
        return 'Message';
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to customers
        </Link>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-5 sm:px-6 border-b">
          <div className="flex items-center">
            {getActionIcon()}
            <h3 className="ml-2 text-lg leading-6 font-medium text-gray-900">
              Bulk {getActionName()} ({selectedCustomers.length} customers)
            </h3>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Send a {getActionName()} to multiple customers at once
          </p>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Selected Customers ({selectedCustomers.length})
            </h4>
            
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-60 overflow-y-auto">
              {selectedCustomers.length === 0 ? (
                <p className="text-gray-500 text-sm">No customers selected</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {selectedCustomers.map(customer => (
                    <li key={customer.id} className="py-2 flex justify-between items-center">
                      <div>
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-indigo-800 font-medium text-sm">
                              {customer.firstname.charAt(0)}{customer.lastname.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {customer.firstname} {customer.lastname}
                            </p>
                            <p className="text-xs text-gray-500">
                              {action === 'email' ? customer.email : customer.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        {phoneErrors[customer.id] && (
                          <span className="text-xs text-red-600 mr-2 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {phoneErrors[customer.id]}
                          </span>
                        )}
                        <button
                          onClick={() => removeCustomer(customer.id)}
                          className="text-gray-400 hover:text-gray-500 p-1"
                          title="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {action === 'email' && (
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  id="subject"
                  type="text"
                  {...register('subject', { required: 'Subject is required for emails' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
              </div>
            )}
            
            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                id="body"
                rows={6}
                {...register('body', { required: 'Message is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder={`Type your ${action} message here...`}
              />
              {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>}
              
              {action === 'sms' && (
                <p className="mt-1 text-xs text-gray-500">
                  SMS messages are limited to 160 characters. Longer messages may be split into multiple SMS.
                </p>
              )}
            </div>
            
            {isSending && (
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Sending in progress...</h4>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600">
                  Sending {progress.current} of {progress.total} • 
                  Success: {progress.success} • 
                  Failed: {progress.failed}
                </p>
              </div>
            )}
            
            <div className="flex justify-end">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSending || selectedCustomers.length === 0 || Object.keys(phoneErrors).length > 0}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${getActionButtonColor()} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : `Send ${getActionName()}`}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Tips for Bulk Messaging</h4>
        <ul className="text-xs text-gray-600 space-y-1 list-disc pl-5">
          <li>Personalize your message by including the customer's name</li>
          <li>Keep messages concise and to the point</li>
          <li>Include a clear call to action</li>
          <li>Avoid sending too many bulk messages in a short period</li>
          <li>Ensure you have permission to contact customers via their preferred channel</li>
          <li>For WhatsApp, customers must have opted in to receive messages</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkCommunication;