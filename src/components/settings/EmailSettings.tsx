import React, { useState } from 'react';
import { Check, AlertCircle, RefreshCw } from 'lucide-react';
import { verifySendGridApiKey, testSendGridConnection } from '../../lib/sendgrid';
import { testSmtpConnection } from '../../lib/smtpService';
import toast from 'react-hot-toast';

interface EmailSettingsProps {
  formData: {
    emailService: 'sendgrid' | 'ses';
    emailMethod: 'api' | 'smtp';
    emailApiKey: string;
    emailFromAddress: string;
    smtpPort: number;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const EmailSettings: React.FC<EmailSettingsProps> = ({ formData, handleChange }) => {
  const [isVerifyingApiKey, setIsVerifyingApiKey] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // Get API key from environment variable if available
  const envApiKey = import.meta.env.VITE_SENDGRID_API_KEY || '';

  const verifyApiKey = async () => {
    const apiKey = formData.emailApiKey || envApiKey;
    if (!apiKey) {
      toast.error('Please enter an API key to verify');
      return;
    }
    
    setIsVerifyingApiKey(true);
    try {
      const isValid = await verifySendGridApiKey(apiKey);
      setApiKeyValid(isValid);
      
      if (isValid) {
        toast.success('SendGrid API key is valid');
      } else {
        toast.error('SendGrid API key is invalid');
      }
    } catch (error) {
      console.error('Error verifying API key:', error);
      toast.error('Error verifying API key');
      setApiKeyValid(false);
    } finally {
      setIsVerifyingApiKey(false);
    }
  };
  
  const testConnection = async () => {
    const apiKey = formData.emailApiKey || envApiKey;
    if (!apiKey) {
      toast.error('Please enter an API key to test connection');
      return;
    }
    
    // Save the API key to localStorage before testing
    try {
      const savedSettings = localStorage.getItem('crmSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        parsedSettings.emailApiKey = apiKey;
        localStorage.setItem('crmSettings', JSON.stringify(parsedSettings));
      } else {
        localStorage.setItem('crmSettings', JSON.stringify({
          emailApiKey: apiKey,
          emailFromAddress: formData.emailFromAddress,
          emailService: formData.emailService,
          emailMethod: formData.emailMethod
        }));
      }
    } catch (error) {
      console.error('Error saving API key to localStorage:', error);
    }
    
    setIsTestingConnection(true);
    try {
      const result = await testSendGridConnection();
      setConnectionTestResult(result);
      
      if (result.success) {
        toast.success('SendGrid connection successful');
      } else {
        toast.error(`SendGrid connection failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Error testing connection');
      setConnectionTestResult({
        success: false,
        message: `Error: ${(error as Error).message}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const testSmtp = async () => {
    const apiKey = formData.emailApiKey || envApiKey;
    if (!apiKey) {
      toast.error('Please enter an API key to test SMTP connection');
      return;
    }
    
    // Save the API key and SMTP port to localStorage before testing
    try {
      const savedSettings = localStorage.getItem('crmSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        parsedSettings.emailApiKey = apiKey;
        parsedSettings.smtpPort = formData.smtpPort;
        localStorage.setItem('crmSettings', JSON.stringify(parsedSettings));
      } else {
        localStorage.setItem('crmSettings', JSON.stringify({
          emailApiKey: apiKey,
          emailFromAddress: formData.emailFromAddress,
          emailService: formData.emailService,
          emailMethod: formData.emailMethod,
          smtpPort: formData.smtpPort
        }));
      }
    } catch (error) {
      console.error('Error saving SMTP settings to localStorage:', error);
    }
    
    setIsTestingSmtp(true);
    try {
      const result = await testSmtpConnection();
      setSmtpTestResult(result);
      
      if (result.success) {
        toast.success('SMTP connection successful');
      } else {
        toast.error(`SMTP connection failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error testing SMTP connection:', error);
      toast.error('Error testing SMTP connection');
      setSmtpTestResult({
        success: false,
        message: `Error: ${(error as Error).message}`
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <div className="space-y-6">
      <h4 className="text-md font-medium text-gray-900 mb-4">Email Service Integration</h4>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="emailService" className="block text-sm font-medium text-gray-700">
            Email Service
          </label>
          <select
            name="emailService"
            id="emailService"
            value={formData.emailService}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="sendgrid">SendGrid</option>
            <option value="ses">Amazon SES</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="emailMethod" className="block text-sm font-medium text-gray-700">
            Sending Method
          </label>
          <select
            name="emailMethod"
            id="emailMethod"
            value={formData.emailMethod}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="api">Web API</option>
            <option value="smtp">SMTP Relay</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="emailApiKey" className="block text-sm font-medium text-gray-700">
            API Key
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="password"
              name="emailApiKey"
              id="emailApiKey"
              value={formData.emailApiKey || envApiKey}
              onChange={handleChange}
              className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <button
              type="button"
              onClick={verifyApiKey}
              disabled={isVerifyingApiKey || (!formData.emailApiKey && !envApiKey)}
              className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isVerifyingApiKey ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          {apiKeyValid === true && (
            <p className="mt-1 text-xs text-green-600 flex items-center">
              <Check className="h-3 w-3 mr-1" />
              API key is valid
            </p>
          )}
          {apiKeyValid === false && (
            <p className="mt-1 text-xs text-red-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              API key is invalid
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="emailFromAddress" className="block text-sm font-medium text-gray-700">
            From Email Address
          </label>
          <input
            type="email"
            name="emailFromAddress"
            id="emailFromAddress"
            value={formData.emailFromAddress}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        {formData.emailMethod === 'smtp' && (
          <div>
            <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700">
              SMTP Port
            </label>
            <select
              name="smtpPort"
              id="smtpPort"
              value={formData.smtpPort}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="25">25 (Unencrypted)</option>
              <option value="587">587 (TLS)</option>
              <option value="465">465 (SSL)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Port 587 (TLS) is recommended for most use cases.
            </p>
          </div>
        )}
        
        <div className="sm:col-span-2">
          {formData.emailMethod === 'api' ? (
            <button
              type="button"
              onClick={testConnection}
              disabled={isTestingConnection || (!formData.emailApiKey && !envApiKey)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isTestingConnection ? 'animate-spin' : ''}`} />
              {isTestingConnection ? 'Testing API Connection...' : 'Test API Connection'}
            </button>
          ) : (
            <button
              type="button"
              onClick={testSmtp}
              disabled={isTestingSmtp || (!formData.emailApiKey && !envApiKey)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isTestingSmtp ? 'animate-spin' : ''}`} />
              {isTestingSmtp ? 'Testing SMTP Connection...' : 'Test SMTP Connection'}
            </button>
          )}
          
          {connectionTestResult && formData.emailMethod === 'api' && (
            <div className={`mt-3 p-3 rounded-md ${connectionTestResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h5 className={`text-sm font-medium ${connectionTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                API Connection Test Result
              </h5>
              <p className={`text-sm ${connectionTestResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {connectionTestResult.message}
              </p>
              {connectionTestResult.details && (
                <div className="mt-2">
                  <details className="text-xs">
                    <summary className={`font-medium cursor-pointer ${connectionTestResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      View Details
                    </summary>
                    <pre className="mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
                      {JSON.stringify(connectionTestResult.details, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}
          
          {smtpTestResult && formData.emailMethod === 'smtp' && (
            <div className={`mt-3 p-3 rounded-md ${smtpTestResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h5 className={`text-sm font-medium ${smtpTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                SMTP Connection Test Result
              </h5>
              <p className={`text-sm ${smtpTestResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {smtpTestResult.message}
              </p>
              {smtpTestResult.details && (
                <div className="mt-2">
                  <details className="text-xs">
                    <summary className={`font-medium cursor-pointer ${smtpTestResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      View Details
                    </summary>
                    <pre className="mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
                      {JSON.stringify(smtpTestResult.details, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {formData.emailMethod === 'api' ? (
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <h5 className="text-sm font-medium text-blue-800 mb-2">SendGrid Web API Integration Status</h5>
          <div className="text-sm text-blue-700">
            <p className="mb-2">
              <span className="font-medium">API Key:</span> {(formData.emailApiKey || envApiKey) ? '✓ Configured' : '❌ Not configured'}
            </p>
            <p className="mb-2">
              <span className="font-medium">From Email:</span> {formData.emailFromAddress ? '✓ Configured' : '❌ Not configured'}
            </p>
            <p>
              <span className="font-medium">Service:</span> {formData.emailService === 'sendgrid' ? '✓ SendGrid' : '✓ Amazon SES'}
            </p>
          </div>
          <div className="mt-3 text-xs text-blue-700">
            <p>Your SendGrid API key is now configured in the system. To complete the setup:</p>
            <ol className="list-decimal ml-4 mt-1 space-y-1">
              <li>Verify your sender email address in your <a href="https://app.sendgrid.com/settings/sender_auth" className="underline" target="_blank" rel="noopener noreferrer">SendGrid dashboard</a></li>
              <li>Create email templates in SendGrid for consistent messaging</li>
              <li>Set up event webhooks to track email opens, clicks, and bounces</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <h5 className="text-sm font-medium text-blue-800 mb-2">SendGrid SMTP Relay Integration Status</h5>
          <div className="text-sm text-blue-700">
            <p className="mb-2">
              <span className="font-medium">SMTP Server:</span> smtp.sendgrid.net
            </p>
            <p className="mb-2">
              <span className="font-medium">SMTP Port:</span> {formData.smtpPort}
            </p>
            <p className="mb-2">
              <span className="font-medium">SMTP Username:</span> apikey
            </p>
            <p className="mb-2">
              <span className="font-medium">SMTP Password:</span> {(formData.emailApiKey || envApiKey) ? '✓ Configured' : '❌ Not configured'}
            </p>
            <p>
              <span className="font-medium">From Email:</span> {formData.emailFromAddress ? '✓ Configured' : '❌ Not configured'}
            </p>
          </div>
          <div className="mt-3 text-xs text-blue-700">
            <p>Your SendGrid SMTP Relay is now configured in the system. To complete the setup:</p>
            <ol className="list-decimal ml-4 mt-1 space-y-1">
              <li>Verify your sender email address in your <a href="https://app.sendgrid.com/settings/sender_auth" className="underline" target="_blank" rel="noopener noreferrer">SendGrid dashboard</a></li>
              <li>Ensure your API key has the "Mail Send" permission</li>
              <li>For production use, consider using port 587 (TLS) for better deliverability</li>
            </ol>
          </div>
        </div>
      )}
      
      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <h5 className="text-sm font-medium text-yellow-800 mb-2">Important SendGrid Requirements</h5>
        <div className="text-sm text-yellow-700">
          <p className="mb-2">For your emails to be delivered successfully:</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Your sender email domain must be verified in SendGrid</li>
            <li>Your API key must have the "Mail Send" permission</li>
            <li>Your account must be in good standing (not suspended)</li>
            <li>For new accounts, you may need to complete additional verification steps</li>
          </ol>
          <p className="mt-2">
            <a href="https://docs.sendgrid.com/for-developers/sending-email/api-getting-started" className="underline text-yellow-800 hover:text-yellow-900" target="_blank" rel="noopener noreferrer">
              View SendGrid documentation →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailSettings;