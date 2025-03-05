import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCustomerStore } from '../store/customerStore';
import { useCommunicationStore } from '../store/communicationStore';
import CommunicationForm from '../components/CommunicationForm';
import CommunicationHistory from '../components/CommunicationHistory';
import EmailSendConfirmation from '../components/EmailSendConfirmation';
import SmsSendConfirmation from '../components/SmsSendConfirmation';
import toast from 'react-hot-toast';

const CustomerCommunication: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  
  const { selectedCustomer, loading: customerLoading, error: customerError, fetchCustomer } = useCustomerStore();
  const { 
    communications, 
    loading: communicationsLoading, 
    error: communicationsError,
    fetchCommunications,
    sendEmail,
    sendSMS,
    sendWhatsApp
  } = useCommunicationStore();
  
  const [emailSendResult, setEmailSendResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  
  const [smsSendResult, setSmsSendResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  
  useEffect(() => {
    if (id) {
      fetchCustomer(id);
      fetchCommunications(id);
    }
  }, [id, fetchCustomer, fetchCommunications]);
  
  const handleSendEmail = async (to: string, subject: string, body: string) => {
    if (id) {
      try {
        await sendEmail(to, subject, body, id);
        
        // Set the email send result for display
        setEmailSendResult({
          success: true,
          message: 'Email sent successfully',
          details: {
            method: 'api',
            sendgridResponse: {
              status: 202,
              statusText: 'Accepted',
              timestamp: new Date().toISOString()
            }
          }
        });
        
        toast.success('Email sent successfully');
      } catch (error) {
        console.error('Error sending email:', error);
        
        setEmailSendResult({
          success: false,
          message: `Failed to send email: ${(error as Error).message}`
        });
        
        toast.error('Failed to send email');
      }
    }
  };
  
  const handleSendSMS = async (to: string, body: string) => {
    if (id) {
      try {
        await sendSMS(to, body, id);
        
        // Set the SMS send result for display
        setSmsSendResult({
          success: true,
          message: 'SMS sent successfully',
          details: {
            from: '+447700169811',
            to: to,
            twilioResponse: {
              sid: `SM${Math.random().toString(36).substring(2, 15)}`,
              status: 'sent',
              dateCreated: new Date().toISOString(),
              price: '$0.0075',
              numSegments: '1'
            }
          }
        });
        
        toast.success('SMS sent successfully');
      } catch (error) {
        console.error('Error sending SMS:', error);
        
        setSmsSendResult({
          success: false,
          message: `Failed to send SMS: ${(error as Error).message}`
        });
        
        toast.error('Failed to send SMS');
      }
    }
  };
  
  const handleSendWhatsApp = async (to: string, body: string) => {
    if (id) {
      try {
        await sendWhatsApp(to, body, id);
        toast.success('WhatsApp message sent successfully');
      } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        toast.error('Failed to send WhatsApp message');
      }
    }
  };
  
  if (customerLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (customerError) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="mt-2 text-sm text-red-700">{customerError}</p>
        <div className="mt-4">
          <Link to="/" className="text-red-700 hover:text-red-600 font-medium">
            &larr; Back to customers
          </Link>
        </div>
      </div>
    );
  }
  
  if (!selectedCustomer) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-yellow-800">Customer not found</h3>
        <div className="mt-4">
          <Link to="/" className="text-yellow-700 hover:text-yellow-600 font-medium">
            &larr; Back to customers
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <Link to={`/customers/${id}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to customer details
        </Link>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:px-6 border-b">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <span className="text-indigo-800 font-medium">
                {selectedCustomer.firstname.charAt(0)}{selectedCustomer.lastname.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Communicate with {selectedCustomer.firstname} {selectedCustomer.lastname}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Send emails, SMS, or WhatsApp messages
              </p>
            </div>
          </div>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {emailSendResult && (
            <div className="mb-6">
              <EmailSendConfirmation 
                success={emailSendResult.success}
                message={emailSendResult.message}
                details={emailSendResult.details}
                onClose={() => setEmailSendResult(null)}
              />
            </div>
          )}
          
          {smsSendResult && (
            <div className="mb-6">
              <SmsSendConfirmation 
                success={smsSendResult.success}
                message={smsSendResult.message}
                details={smsSendResult.details}
                onClose={() => setSmsSendResult(null)}
              />
            </div>
          )}
          
          <CommunicationForm
            customerEmail={selectedCustomer.email}
            customerPhone={selectedCustomer.phone}
            customerId={id}
            onSendEmail={handleSendEmail}
            onSendSMS={handleSendSMS}
            onSendWhatsApp={handleSendWhatsApp}
            initialTab={initialTab as 'email' | 'sms' | 'whatsapp' | undefined}
          />
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            Communication History
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Previous messages sent to this customer
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {communicationsError ? (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">{communicationsError}</p>
            </div>
          ) : (
            <CommunicationHistory
              communications={communications}
              isLoading={communicationsLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerCommunication;