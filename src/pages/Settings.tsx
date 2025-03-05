import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import GeneralSettings from '../components/settings/GeneralSettings';
import EmailSettings from '../components/settings/EmailSettings';
import SmsSettings from '../components/settings/SmsSettings';
import WhatsAppSettings from '../components/settings/WhatsAppSettings';
import WebhookSettings from '../components/settings/WebhookSettings';

interface SettingsFormData {
  companyName: string;
  emailSignature: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  whatsappBusinessId: string;
  whatsappApiKey: string;
  whatsappPhoneNumberId: string;
  whatsappCertificate: string;
  whatsappDisplayName: string;
  emailService: 'sendgrid' | 'ses';
  emailMethod: 'api' | 'smtp';
  emailApiKey: string;
  emailFromAddress: string;
  smtpPort: number;
  webhookSecretKey: string;
  webhookNotificationEmail: string;
  enableEmailWebhooks: boolean;
  enableSmsWebhooks: boolean;
  enableWhatsappWebhooks: boolean;
}

const Settings: React.FC = () => {
  const [formData, setFormData] = useState<SettingsFormData>({
    companyName: 'My Company',
    emailSignature: 'Best regards,\nThe [Your Name] Team',
    twilioAccountSid: 'AC9116ed2ee7f1fc4a1a94c9a2e84cf4d5',
    twilioAuthToken: '62f592d15e14d8bb40aff42b3529f606',
    twilioPhoneNumber: '+447700169811',
    whatsappBusinessId: '',
    whatsappApiKey: 'SKe65d5c0e00c3be4f62d37191d87a0f7b',
    whatsappPhoneNumberId: '',
    whatsappCertificate: 'CmgKJAj33YWrudaVAxIGZW50OndhIgtKYW1lcyBNaWxsc1DvipO+BhpAb2iOjxnJkrzf4KmncXDGPRdMIhSdamIEaKXwxzd64hOEBGksUzErOFKbSvShP3kVMqSPH4eM6o8N86FNzZ+YChIvbRtNorfxvNnzWrK2nKtqKZVb4uJexPYFqUYS9osc/HxEbS8kpiealBhnLfQsYd4=',
    whatsappDisplayName: 'James Mills',
    emailService: 'sendgrid',
    emailMethod: 'api',
    emailApiKey: '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',
    emailFromAddress: 'contact@mycompany.com',
    smtpPort: 587,
    webhookSecretKey: 'whsec_8f1e2d3c4b5a6978',
    webhookNotificationEmail: 'webhooks@mycompany.com',
    enableEmailWebhooks: true,
    enableSmsWebhooks: false,
    enableWhatsappWebhooks: false
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'sms' | 'whatsapp' | 'webhooks'>('webhooks');
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('crmSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setFormData(prevData => ({
          ...prevData,
          ...parsedSettings
        }));
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Save settings to localStorage
    try {
      localStorage.setItem('crmSettings', JSON.stringify(formData));
      
      // Simulate API call
      setTimeout(() => {
        setIsSaving(false);
        toast.success('Settings saved successfully');
      }, 1000);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
      setIsSaving(false);
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            System Configuration
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Configure your CRM settings and integrations
          </p>
        </div>
        
        <div className="flex flex-wrap border-b overflow-x-auto">
          <button
            className={`py-3 px-4 whitespace-nowrap ${activeTab === 'general' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`py-3 px-4 whitespace-nowrap ${activeTab === 'email' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('email')}
          >
            Email
          </button>
          <button
            className={`py-3 px-4 whitespace-nowrap ${activeTab === 'sms' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('sms')}
          >
            SMS
          </button>
          <button
            className={`py-3 px-4 whitespace-nowrap ${activeTab === 'whatsapp' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('whatsapp')}
          >
            WhatsApp
          </button>
          <button
            className={`py-3 px-4 whitespace-nowrap ${activeTab === 'webhooks' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('webhooks')}
          >
            Webhooks
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          {activeTab === 'general' && (
            <GeneralSettings formData={formData} handleChange={handleChange} />
          )}
          
          {activeTab === 'email' && (
            <EmailSettings formData={formData} handleChange={handleChange} />
          )}
          
          {activeTab === 'sms' && (
            <SmsSettings formData={formData} handleChange={handleChange} />
          )}
          
          {activeTab === 'whatsapp' && (
            <WhatsAppSettings formData={formData} handleChange={handleChange} />
          )}
          
          {activeTab === 'webhooks' && (
            <WebhookSettings formData={formData} handleChange={handleChange} />
          )}
          
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;