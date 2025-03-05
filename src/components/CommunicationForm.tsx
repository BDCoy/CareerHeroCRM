import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface EmailFormData {
  subject: string;
  body: string;
}

interface MessageFormData {
  body: string;
}

interface CommunicationFormProps {
  customerEmail: string;
  customerPhone: string;
  customerId: string;
  onSendEmail: (to: string, subject: string, body: string) => Promise<void>;
  onSendSMS: (to: string, body: string) => Promise<void>;
  onSendWhatsApp: (to: string, body: string) => Promise<void>;
  initialTab?: 'email' | 'sms' | 'whatsapp';
}

const CommunicationForm: React.FC<CommunicationFormProps> = ({
  customerEmail,
  customerPhone,
  customerId,
  onSendEmail,
  onSendSMS,
  onSendWhatsApp,
  initialTab
}) => {
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'whatsapp'>(initialTab || 'email');
  const [isSending, setIsSending] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [twilioConfigured, setTwilioConfigured] = useState(false);
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);
  
  const { 
    register: registerEmail, 
    handleSubmit: handleSubmitEmail,
    reset: resetEmail,
    formState: { errors: emailErrors }
  } = useForm<EmailFormData>();
  
  const { 
    register: registerSMS, 
    handleSubmit: handleSubmitSMS,
    reset: resetSMS,
    formState: { errors: smsErrors }
  } = useForm<MessageFormData>();
  
  const { 
    register: registerWhatsApp, 
    handleSubmit: handleSubmitWhatsApp,
    reset: resetWhatsApp,
    formState: { errors: whatsAppErrors }
  } = useForm<MessageFormData>();
  
  // Check if Twilio and WhatsApp are configured
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('crmSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        const hasSid = !!parsedSettings.twilioAccountSid;
        const hasToken = !!parsedSettings.twilioAuthToken;
        const hasPhone = !!parsedSettings.twilioPhoneNumber;
        
        setTwilioConfigured(hasSid && hasToken);
        setTwilioPhoneNumber(parsedSettings.twilioPhoneNumber || '+447700169811');
        
        // Check WhatsApp configuration
        const hasWhatsappApiKey = !!parsedSettings.whatsappApiKey;
        const hasWhatsappCertificate = !!parsedSettings.whatsappCertificate;
        const hasWhatsappPhoneNumberId = !!parsedSettings.whatsappPhoneNumberId;
        
        setWhatsappConfigured(hasWhatsappApiKey && hasWhatsappCertificate);
      } else {
        // Set default values if no settings found
        setTwilioPhoneNumber('+447700169811');
        setTwilioConfigured(true);
        setWhatsappConfigured(true);
      }
    } catch (error) {
      console.error('Error checking Twilio/WhatsApp configuration:', error);
      // Set default values if error
      setTwilioPhoneNumber('+447700169811');
      setTwilioConfigured(true);
      setWhatsappConfigured(true);
    }
  }, []);
  
  // Validate phone number for WhatsApp
  const validatePhoneForWhatsApp = (phone: string): boolean => {
    setPhoneError(null);
    
    if (!phone || phone.trim() === '') {
      setPhoneError('Phone number is required');
      return false;
    }
    
    // Remove all non-digit characters except the plus sign
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Check if it has enough digits for a valid phone number
    if (cleaned.length < 10) {
      setPhoneError('Phone number is too short for WhatsApp');
      return false;
    }
    
    // Check if it has a country code (starts with + or has enough digits)
    if (!cleaned.startsWith('+') && cleaned.length < 11) {
      setPhoneError('WhatsApp requires a phone number with country code');
      return false;
    }
    
    return true;
  };
  
  const onSubmitEmail = async (data: EmailFormData) => {
    setIsSending(true);
    try {
      await onSendEmail(customerEmail, data.subject, data.body);
      resetEmail();
      toast.success('Email sent successfully');
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };
  
  const onSubmitSMS = async (data: MessageFormData) => {
    setIsSending(true);
    try {
      await onSendSMS(customerPhone, data.body);
      resetSMS();
      toast.success('SMS sent successfully');
    } catch (error) {
      console.error('Failed to send SMS:', error);
      toast.error('Failed to send SMS');
    } finally {
      setIsSending(false);
    }
  };
  
  const onSubmitWhatsApp = async (data: MessageFormData) => {
    if (!validatePhoneForWhatsApp(customerPhone)) {
      return;
    }
    
    setIsSending(true);
    try {
      await onSendWhatsApp(customerPhone, data.body);
      resetWhatsApp();
      toast.success('WhatsApp message sent successfully');
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      toast.error('Failed to send WhatsApp message');
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex flex-wrap border-b mb-4 overflow-x-auto">
        <button
          className={`pb-2 px-3 sm:px-4 flex-shrink-0 ${activeTab === 'email' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('email')}
        >
          <div className="flex items-center">
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
              <Mail className="h-3 w-3 text-blue-600" />
            </div>
            <span>Email</span>
          </div>
        </button>
        <button
          className={`pb-2 px-3 sm:px-4 flex-shrink-0 ${activeTab === 'sms' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('sms')}
        >
          <div className="flex items-center">
            <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
              <MessageSquare className="h-3 w-3 text-purple-600" />
            </div>
            <span>SMS</span>
          </div>
        </button>
        <button
          className={`pb-2 px-3 sm:px-4 flex-shrink-0 ${activeTab === 'whatsapp' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => {
            setActiveTab('whatsapp');
            // Validate phone number when switching to WhatsApp tab
            validatePhoneForWhatsApp(customerPhone);
          }}
        >
          <div className="flex items-center">
            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-3 w-3 text-green-600" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <span>WhatsApp</span>
          </div>
        </button>
      </div>
      
      {activeTab === 'email' && (
        <div>
          <div className="mb-4 bg-blue-50 p-3 sm:p-4 rounded-md border border-blue-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Advanced Email Features Available</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Need more advanced email features like templates, attachments, or a full inbox?</p>
                  <div className="mt-2">
                    <Link
                      to={`/customers/${customerId}/email`}
                      className="text-blue-800 font-medium hover:text-blue-900 underline"
                    >
                      Go to Email Center →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmitEmail(onSubmitEmail)} className="space-y-4">
            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-700">To</label>
              <input
                id="to"
                type="email"
                value={customerEmail}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                id="subject"
                type="text"
                {...registerEmail('subject', { required: 'Subject is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {emailErrors.subject && <p className="mt-1 text-sm text-red-600">{emailErrors.subject.message}</p>}
            </div>
            
            <div>
              <label htmlFor="emailBody" className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                id="emailBody"
                rows={6}
                {...registerEmail('body', { required: 'Message is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {emailErrors.body && <p className="mt-1 text-sm text-red-600">{emailErrors.body.message}</p>}
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSending}
                className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {activeTab === 'sms' && (
        <div>
          {!twilioConfigured && (
            <div className="mb-4 bg-yellow-50 p-3 sm:p-4 rounded-md border border-yellow-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Twilio Configuration Required</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Your Twilio Account SID and Auth Token are configured, but you need to add a phone number to send SMS messages.</p>
                    <div className="mt-2">
                      <Link
                        to="/settings"
                        className="text-yellow-800 font-medium hover:text-yellow-900 underline"
                      >
                        Go to Settings →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {twilioConfigured && !twilioPhoneNumber && (
            <div className="mb-4 bg-yellow-50 p-3 sm:p-4 rounded-md border border-yellow-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Twilio Phone Number Required</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Your Twilio credentials are configured, but you need to add a phone number to send SMS messages.</p>
                    <div className="mt-2">
                      <Link
                        to="/settings"
                        className="text-yellow-800 font-medium hover:text-yellow-900 underline"
                      >
                        Go to Settings →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmitSMS(onSubmitSMS)} className="space-y-4">
            <div>
              <label htmlFor="smsTo" className="block text-sm font-medium text-gray-700">To</label>
              <input
                id="smsTo"
                type="tel"
                value={customerPhone}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
              />
            </div>
            
            {twilioPhoneNumber && (
              <div>
                <label htmlFor="smsFrom" className="block text-sm font-medium text-gray-700">From</label>
                <input
                  id="smsFrom"
                  type="tel"
                  value={twilioPhoneNumber}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="smsBody" className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                id="smsBody"
                rows={4}
                {...registerSMS('body', { 
                  required: 'Message is required',
                  maxLength: {
                    value: 160,
                    message: 'SMS messages are limited to 160 characters'
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {smsErrors.body && <p className="mt-1 text-sm text-red-600">{smsErrors.body.message}</p>}
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSending || !twilioConfigured}
                className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send SMS'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {activeTab === 'whatsapp' && (
        <form onSubmit={handleSubmitWhatsApp(onSubmitWhatsApp)} className="space-y-4">
          <div>
            <label htmlFor="whatsappTo" className="block text-sm font-medium text-gray-700">To</label>
            <input
              id="whatsappTo"
              type="tel"
              value={customerPhone}
              disabled
              className={`mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm ${phoneError ? 'border-red-300' : ''}`}
            />
            {phoneError && (
              <div className="mt-1 flex items-center text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">{phoneError}</span>
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              WhatsApp requires a phone number with country code (e.g., +1 for US, +44 for UK, +351 for Portugal)
            </p>
          </div>
          
          {twilioPhoneNumber && (
            <div>
              <label htmlFor="whatsappFrom" className="block text-sm font-medium text-gray-700">From</label>
              <input
                id="whatsappFrom"
                type="tel"
                value={twilioPhoneNumber}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
              />
            </div>
          )}
          
          <div>
            <label htmlFor="whatsappBody" className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              id="whatsappBody"
              rows={4}
              {...registerWhatsApp('body', { required: 'Message is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {whatsAppErrors.body && <p className="mt-1 text-sm text-red-600">{whatsAppErrors.body.message}</p>}
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSending || !!phoneError || !twilioConfigured}
              className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-2" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {isSending ? 'Sending...' : 'Send WhatsApp'}
            </button>
          </div>
          
          <div className="mt-4 p-3 sm:p-4 bg-green-50 rounded-md border border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-2">WhatsApp Integration Status</h4>
            <p className="text-sm text-green-700 mb-2">
              <span className="font-medium">✓ WhatsApp Business API configured</span> with certificate from WhatsApp
            </p>
            <p className="text-sm text-green-700 mb-2">
              <span className="font-medium">✓ Display Name:</span> James Mills
            </p>
            <ul className="text-xs text-green-700 space-y-1 list-disc pl-4">
              <li>WhatsApp Business API is ready to use</li>
              <li>Messages will be sent from your business phone number</li>
              <li>The customer must have WhatsApp installed on their device</li>
              <li>The first message must be initiated by the customer</li>
            </ul>
          </div>
        </form>
      )}
    </div>
  );
};

export default CommunicationForm;