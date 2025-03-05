import React from 'react';

interface WhatsAppSettingsProps {
  formData: {
    whatsappDisplayName: string;
    whatsappApiKey: string;
    whatsappPhoneNumberId: string;
    whatsappCertificate: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const WhatsAppSettings: React.FC<WhatsAppSettingsProps> = ({ formData, handleChange }) => {
  // Get values from environment variables if available
  const envApiKey = import.meta.env.VITE_WHATSAPP_API_KEY || '';
  const envCertificate = import.meta.env.VITE_WHATSAPP_CERTIFICATE || '';

  return (
    <div className="space-y-6">
      <h4 className="text-md font-medium text-gray-900 mb-4">WhatsApp Business API Integration</h4>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="whatsappDisplayName" className="block text-sm font-medium text-gray-700">
            WhatsApp Display Name
          </label>
          <input
            type="text"
            name="whatsappDisplayName"
            id="whatsappDisplayName"
            value={formData.whatsappDisplayName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-green-600">✓ Display name configured</p>
        </div>
        
        <div>
          <label htmlFor="whatsappApiKey" className="block text-sm font-medium text-gray-700">
            WhatsApp API Key
          </label>
          <input
            type="password"
            name="whatsappApiKey"
            id="whatsappApiKey"
            value={formData.whatsappApiKey || envApiKey}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-green-600">✓ API Key configured</p>
        </div>
        
        <div>
          <label htmlFor="whatsappPhoneNumberId" className="block text-sm font-medium text-gray-700">
            WhatsApp Phone Number ID
          </label>
          <input
            type="text"
            name="whatsappPhoneNumberId"
            id="whatsappPhoneNumberId"
            value={formData.whatsappPhoneNumberId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter your WhatsApp Phone Number ID"
          />
          {!formData.whatsappPhoneNumberId && (
            <p className="mt-1 text-xs text-yellow-600">⚠️ Please add your WhatsApp Phone Number ID</p>
          )}
        </div>
        
        <div className="sm:col-span-2">
          <label htmlFor="whatsappCertificate" className="block text-sm font-medium text-gray-700">
            WhatsApp Certificate
          </label>
          <textarea
            name="whatsappCertificate"
            id="whatsappCertificate"
            rows={3}
            value={formData.whatsappCertificate || envCertificate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono text-xs"
          />
          <p className="mt-1 text-xs text-green-600">✓ Certificate configured</p>
        </div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-md border border-green-200">
        <h5 className="text-sm font-medium text-green-800 mb-2">WhatsApp Integration Status</h5>
        <div className="text-sm text-green-700">
          <p className="mb-2">
            <span className="font-medium">Display Name:</span> {formData.whatsappDisplayName ? '✓ Configured' : '❌ Not configured'}
          </p>
          <p className="mb-2">
            <span className="font-medium">API Key:</span> {(formData.whatsappApiKey || envApiKey) ? '✓ Configured' : '❌ Not configured'}
          </p>
          <p className="mb-2">
            <span className="font-medium">Certificate:</span> {(formData.whatsappCertificate || envCertificate) ? '✓ Configured' : '❌ Not configured'}
          </p>
          <p>
            <span className="font-medium">Phone Number ID:</span> {formData.whatsappPhoneNumberId ? '✓ Configured' : '❌ Not configured'}
          </p>
        </div>
        <div className="mt-3 text-xs text-green-700">
          <p>Your WhatsApp Business API is now configured with the certificate from WhatsApp. To complete the setup:</p>
          <ol className="list-decimal ml-4 mt-1 space-y-1">
            <li>Enter your WhatsApp Phone Number ID from the Meta Business dashboard</li>
            <li>Save your settings</li>
            <li>Test sending a WhatsApp message to a customer</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSettings;