import React from 'react';
import { Link } from 'react-router-dom';
import { Webhook, ExternalLink } from 'lucide-react';

interface WebhookSettingsProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const WebhookSettings: React.FC<WebhookSettingsProps> = ({ formData, handleChange }) => {
  return (
    <div className="space-y-6">
      <h4 className="text-md font-medium text-gray-900 mb-4">Webhook Settings</h4>
      
      <div className="bg-indigo-50 p-4 rounded-md border border-indigo-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <Webhook className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-indigo-800">Configure Webhooks</h3>
            <div className="mt-2 text-sm text-indigo-700">
              <p>Set up webhooks to automatically process incoming emails, SMS, and WhatsApp messages.</p>
              <div className="mt-3">
                <Link
                  to="/webhook-settings"
                  className="inline-flex items-center text-indigo-800 font-medium hover:text-indigo-900"
                >
                  Go to Webhook Configuration
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="webhookSecretKey" className="block text-sm font-medium text-gray-700">
            Webhook Secret Key
          </label>
          <input
            type="password"
            name="webhookSecretKey"
            id="webhookSecretKey"
            value={formData.webhookSecretKey || ''}
            onChange={handleChange}
            placeholder="Enter a secret key to secure your webhooks"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            This secret key will be used to verify that webhook requests are coming from authorized sources.
          </p>
        </div>
        
        <div>
          <label htmlFor="webhookNotificationEmail" className="block text-sm font-medium text-gray-700">
            Webhook Notification Email
          </label>
          <input
            type="email"
            name="webhookNotificationEmail"
            id="webhookNotificationEmail"
            value={formData.webhookNotificationEmail || ''}
            onChange={handleChange}
            placeholder="Enter email to receive webhook notifications"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            You'll receive notifications at this email when webhooks are triggered.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Webhook Features
          </label>
          <div className="space-y-2">
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="enableEmailWebhooks"
                  name="enableEmailWebhooks"
                  type="checkbox"
                  checked={formData.enableEmailWebhooks || false}
                  onChange={(e) => handleChange({
                    target: {
                      name: e.target.name,
                      value: e.target.checked
                    }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="enableEmailWebhooks" className="font-medium text-gray-700">
                  Enable Email Webhooks
                </label>
                <p className="text-gray-500">
                  Process incoming emails with resume attachments to create new customer records
                </p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="enableSmsWebhooks"
                  name="enableSmsWebhooks"
                  type="checkbox"
                  checked={formData.enableSmsWebhooks || false}
                  onChange={(e) => handleChange({
                    target: {
                      name: e.target.name,
                      value: e.target.checked
                    }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="enableSmsWebhooks" className="font-medium text-gray-700">
                  Enable SMS Webhooks
                </label>
                <p className="text-gray-500">
                  Receive and respond to SMS messages from customers
                </p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="enableWhatsappWebhooks"
                  name="enableWhatsappWebhooks"
                  type="checkbox"
                  checked={formData.enableWhatsappWebhooks || false}
                  onChange={(e) => handleChange({
                    target: {
                      name: e.target.name,
                      value: e.target.checked
                    }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="enableWhatsappWebhooks" className="font-medium text-gray-700">
                  Enable WhatsApp Webhooks
                </label>
                <p className="text-gray-500">
                  Receive and respond to WhatsApp messages from customers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-green-50 p-4 rounded-md border border-green-200">
        <h4 className="text-sm font-medium text-green-800 mb-2">Webhook Server Status</h4>
        <p className="text-sm text-green-700 mb-2">
          The webhook server is running and ready to receive incoming messages.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-green-800">SendGrid Email Webhook:</p>
            <code className="block mt-1 p-2 bg-white rounded border border-green-200 text-xs overflow-x-auto">
              http://localhost:3001/api/webhooks/sendgrid/inbound
            </code>
          </div>
          <div>
            <p className="font-medium text-green-800">Twilio SMS Webhook:</p>
            <code className="block mt-1 p-2 bg-white rounded border border-green-200 text-xs overflow-x-auto">
              http://localhost:3001/api/webhooks/twilio/sms
            </code>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-sm text-green-700">
            To expose these webhooks to the internet, use a service like ngrok:
          </p>
          <code className="block mt-1 p-2 bg-white rounded border border-green-200 text-xs overflow-x-auto">
            npx ngrok http 3001
          </code>
        </div>
      </div>
    </div>
  );
};

export default WebhookSettings;