import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, RefreshCw, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { testTwilioConnection } from '../../lib/twilioService';

interface SmsSettingsProps {
  formData: {
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioPhoneNumber: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const SmsSettings: React.FC<SmsSettingsProps> = ({ formData, handleChange }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [credentialType, setCredentialType] = useState<'apikey' | 'account'>('apikey');
  
  // Set the default phone number if it's not already set
  useEffect(() => {
    if (!formData.twilioPhoneNumber) {
      // Use the provided phone number or environment variable
      const defaultPhoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '+447700169811';
      
      // Update localStorage directly
      try {
        const savedSettings = localStorage.getItem('crmSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          parsedSettings.twilioPhoneNumber = defaultPhoneNumber;
          localStorage.setItem('crmSettings', JSON.stringify(parsedSettings));
        }
      } catch (error) {
        console.error('Error updating phone number in localStorage:', error);
      }
      
      // Trigger the handleChange function with a synthetic event
      const syntheticEvent = {
        target: {
          name: 'twilioPhoneNumber',
          value: defaultPhoneNumber
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleChange(syntheticEvent);
    }
  }, [formData.twilioPhoneNumber, handleChange]);

  // Determine credential type based on the current value
  useEffect(() => {
    if (formData.twilioAccountSid.startsWith('SK')) {
      setCredentialType('apikey');
    } else if (formData.twilioAccountSid.startsWith('AC')) {
      setCredentialType('account');
    }
  }, [formData.twilioAccountSid]);

  const handleCredentialTypeChange = (type: 'apikey' | 'account') => {
    setCredentialType(type);
    
    // Update the credentials based on the selected type
    if (type === 'apikey') {
      // Set API Key SID and Secret from env vars or defaults
      const apiKeySid = import.meta.env.VITE_TWILIO_API_KEY_SID || 'SKde05f2348b818e3b91a9e1de3c820581';
      const apiKeySecret = import.meta.env.VITE_TWILIO_API_KEY_SECRET || 'vktJRXyYRSCSI1nuOONd2DaNl5s0eIT8';
      
      const syntheticEventSid = {
        target: {
          name: 'twilioAccountSid',
          value: apiKeySid
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      const syntheticEventToken = {
        target: {
          name: 'twilioAuthToken',
          value: apiKeySecret
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleChange(syntheticEventSid);
      handleChange(syntheticEventToken);
    } else {
      // Set Account SID and Auth Token from env vars or defaults
      const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID || 'AC9116ed2ee7f1fc4a1a94c9a2e84cf4d5';
      const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '62f592d15e14d8bb40aff42b3529f606';
      
      const syntheticEventSid = {
        target: {
          name: 'twilioAccountSid',
          value: accountSid
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      const syntheticEventToken = {
        target: {
          name: 'twilioAuthToken',
          value: authToken
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleChange(syntheticEventSid);
      handleChange(syntheticEventToken);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.twilioAccountSid || !formData.twilioAuthToken) {
      toast.error('Please enter your Twilio credentials');
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Save the current settings to localStorage before testing
      try {
        const savedSettings = localStorage.getItem('crmSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          parsedSettings.twilioAccountSid = formData.twilioAccountSid;
          parsedSettings.twilioAuthToken = formData.twilioAuthToken;
          parsedSettings.twilioPhoneNumber = formData.twilioPhoneNumber;
          localStorage.setItem('crmSettings', JSON.stringify(parsedSettings));
        } else {
          localStorage.setItem('crmSettings', JSON.stringify({
            twilioAccountSid: formData.twilioAccountSid,
            twilioAuthToken: formData.twilioAuthToken,
            twilioPhoneNumber: formData.twilioPhoneNumber
          }));
        }
      } catch (error) {
        console.error('Error saving Twilio settings to localStorage:', error);
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test the Twilio connection
      const result = await testTwilioConnection();
      setTestResult(result);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error testing Twilio connection:', error);
      setTestResult({
        success: false,
        message: `Error: ${(error as Error).message}`
      });
      toast.error('Error testing Twilio connection');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h4 className="text-md font-medium text-gray-900 mb-4">Twilio SMS Integration</h4>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Credential Type
        </label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => handleCredentialTypeChange('apikey')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              credentialType === 'apikey'
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            API Key
          </button>
          <button
            type="button"
            onClick={() => handleCredentialTypeChange('account')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              credentialType === 'account'
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Account SID
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="twilioAccountSid" className="block text-sm font-medium text-gray-700">
            {credentialType === 'apikey' ? 'Twilio API Key SID' : 'Twilio Account SID'}
          </label>
          <input
            type="text"
            name="twilioAccountSid"
            id="twilioAccountSid"
            value={formData.twilioAccountSid}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {credentialType === 'apikey' ? (
            formData.twilioAccountSid === import.meta.env.VITE_TWILIO_API_KEY_SID || formData.twilioAccountSid === 'SKde05f2348b818e3b91a9e1de3c820581' ? (
              <p className="mt-1 text-xs text-green-600 flex items-center">
                <Check className="h-3 w-3 mr-1" />
                API Key SID configured correctly
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Enter your Twilio API Key SID (starts with "SK")
              </p>
            )
          ) : (
            formData.twilioAccountSid === import.meta.env.VITE_TWILIO_ACCOUNT_SID || formData.twilioAccountSid === 'AC9116ed2ee7f1fc4a1a94c9a2e84cf4d5' ? (
              <p className="mt-1 text-xs text-green-600 flex items-center">
                <Check className="h-3 w-3 mr-1" />
                Account SID configured correctly
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Enter your Twilio Account SID (starts with "AC")
              </p>
            )
          )}
        </div>
        
        <div>
          <label htmlFor="twilioAuthToken" className="block text-sm font-medium text-gray-700">
            {credentialType === 'apikey' ? 'Twilio API Secret' : 'Twilio Auth Token'}
          </label>
          <input
            type="password"
            name="twilioAuthToken"
            id="twilioAuthToken"
            value={formData.twilioAuthToken}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {credentialType === 'apikey' ? (
            formData.twilioAuthToken === import.meta.env.VITE_TWILIO_API_KEY_SECRET || formData.twilioAuthToken === 'vktJRXyYRSCSI1nuOONd2DaNl5s0eIT8' ? (
              <p className="mt-1 text-xs text-green-600 flex items-center">
                <Check className="h-3 w-3 mr-1" />
                API Secret configured correctly
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Enter your Twilio API Secret
              </p>
            )
          ) : (
            formData.twilioAuthToken === import.meta.env.VITE_TWILIO_AUTH_TOKEN || formData.twilioAuthToken === '62f592d15e14d8bb40aff42b3529f606' ? (
              <p className="mt-1 text-xs text-green-600 flex items-center">
                <Check className="h-3 w-3 mr-1" />
                Auth Token configured correctly
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Enter your Twilio Auth Token
              </p>
            )
          )}
        </div>
        
        <div>
          <label htmlFor="twilioPhoneNumber" className="block text-sm font-medium text-gray-700">
            Twilio Phone Number
          </label>
          <input
            type="text"
            name="twilioPhoneNumber"
            id="twilioPhoneNumber"
            value={formData.twilioPhoneNumber}
            onChange={handleChange}
            placeholder="+1234567890"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {!formData.twilioPhoneNumber ? (
            <p className="mt-1 text-xs text-yellow-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Please add a Twilio phone number to send SMS
            </p>
          ) : (
            <p className="mt-1 text-xs text-green-600 flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Phone number configured
            </p>
          )}
        </div>
        
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || !formData.twilioAccountSid || !formData.twilioAuthToken}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Testing Twilio Connection...' : 'Test Twilio Connection'}
          </button>
          
          {testResult && (
            <div className={`mt-3 p-3 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h5 className={`text-sm font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                Twilio Connection Test Result
              </h5>
              <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {testResult.message}
              </p>
              {testResult.details && (
                <div className="mt-2">
                  <details className="text-xs">
                    <summary className={`font-medium cursor-pointer ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      View Details
                    </summary>
                    <pre className="mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
        <h5 className="text-sm font-medium text-blue-800 mb-2">SMS Integration Status</h5>
        <div className="text-sm text-blue-700">
          <p className="mb-2">
            <span className="font-medium">
              {credentialType === 'apikey' ? 'API Key SID:' : 'Account SID:'}
            </span> {formData.twilioAccountSid ? '✓ Configured' : '❌ Not configured'}
          </p>
          <p className="mb-2">
            <span className="font-medium">
              {credentialType === 'apikey' ? 'API Secret:' : 'Auth Token:'}
            </span> {formData.twilioAuthToken ? '✓ Configured' : '❌ Not configured'}
          </p>
          <p>
            <span className="font-medium">Phone Number:</span> {formData. twilioPhoneNumber ? '✓ Configured' : '❌ Not configured'}
          </p>
        </div>
        <div className="mt-3 text-xs text-blue-700">
          <p>Your Twilio credentials are now configured in the system. To complete the setup:</p>
          <ol className="list-decimal ml-4 mt-1 space-y-1">
            <li>Purchase a phone number from your <a href="https://www.twilio.com/console/phone-numbers/incoming" className="underline" target="_blank" rel="noopener noreferrer">Twilio dashboard</a></li>
            <li>Enter the phone number above in international format (e.g., +1234567890)</li>
            <li>Save your settings</li>
          </ol>
        </div>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <Phone className="h-5 w-5 text-purple-400" />
          </div>
          <div className="ml-3">
            <h5 className="text-sm font-medium text-purple-800">Twilio SMS Features</h5>
            <div className="mt-2 text-sm text-purple-700">
              <p className="mb-2">With Twilio SMS integration, you can:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Send personalized text messages to customers</li>
                <li>Set up automated SMS notifications</li>
                <li>Send appointment reminders</li>
                <li>Implement two-way SMS conversations</li>
                <li>Track message delivery status</li>
              </ul>
              <p className="mt-2">
                <a href="https://www.twilio.com/docs/sms" className="underline text-purple-800 hover:text-purple-900" target="_blank" rel="noopener noreferrer">
                  Learn more about Twilio SMS →
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmsSettings;