import React, { useState } from 'react';
import { AlertCircle, Check, RefreshCw, Send } from 'lucide-react';
import { testSendGridConnection } from '../lib/sendgrid';
import { testSmtpConnection } from '../lib/smtpService';
import { sendEmail } from '../lib/api';
import toast from 'react-hot-toast';

interface EmailDebuggerProps {
  customerId?: string;
}

const EmailDebugger: React.FC<EmailDebuggerProps> = ({ customerId = 'debug' }) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<any>(null);
  const [testEmailTo, setTestEmailTo] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<any>(null);
  const [emailMethod, setEmailMethod] = useState<'api' | 'smtp'>('api');
  
  // Get the email method from localStorage
  React.useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('crmSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.emailMethod) {
          setEmailMethod(parsedSettings.emailMethod);
        }
      }
    } catch (error) {
      console.error('Error getting email method from localStorage:', error);
    }
  }, []);
  
  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionResult(null);
    
    try {
      const result = await testSendGridConnection();
      setConnectionResult(result);
      
      if (result.success) {
        toast.success('SendGrid API connection successful');
      } else {
        toast.error(`SendGrid API connection failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionResult({
        success: false,
        message: `Error: ${(error as Error).message}`
      });
      toast.error('Error testing connection');
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const testSmtp = async () => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);
    
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
      setSmtpTestResult({
        success: false,
        message: `Error: ${(error as Error).message}`
      });
      toast.error('Error testing SMTP connection');
    } finally {
      setIsTestingSmtp(false);
    }
  };
  
  const sendTestEmail = async () => {
    if (!testEmailTo) {
      toast.error('Please enter a recipient email address');
      return;
    }
    
    setIsSendingTest(true);
    setTestEmailResult(null);
    
    try {
      const result = await sendEmail(
        testEmailTo,
        'Test Email from CRM System',
        'This is a test email sent from your CRM system to verify that email sending is working correctly.\n\nIf you received this email, your email configuration is working!',
        customerId
      );
      
      setTestEmailResult({
        success: true,
        message: 'Test email sent successfully',
        details: result
      });
      
      toast.success('Test email sent successfully');
    } catch (error) {
      console.error('Error sending test email:', error);
      setTestEmailResult({
        success: false,
        message: `Error: ${(error as Error).message}`
      });
      toast.error('Error sending test email');
    } finally {
      setIsSendingTest(false);
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Email Debugging Tools
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Tools to help diagnose email sending issues
        </p>
      </div>
      
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Connection Tests</h4>
          <p className="text-sm text-gray-500 mb-4">
            Test your email service connection to verify your configuration.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testConnection}
              disabled={isTestingConnection}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isTestingConnection ? 'animate-spin' : ''}`} />
              {isTestingConnection ? 'Testing API...' : 'Test SendGrid API'}
            </button>
            
            <button
              onClick={testSmtp}
              disabled={isTestingSmtp}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isTestingSmtp ? 'animate-spin' : ''}`} />
              {isTestingSmtp ? 'Testing SMTP...' : 'Test SMTP Relay'}
            </button>
          </div>
          
          {connectionResult && (
            <div className={`mt-4 p-4 rounded-md ${connectionResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {connectionResult.success ? (
                    <Check className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${connectionResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {connectionResult.success ? 'API Connection Successful' : 'API Connection Failed'}
                  </h3>
                  <div className={`mt-2 text-sm ${connectionResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    <p>{connectionResult.message}</p>
                  </div>
                  
                  {connectionResult.details && (
                    <div className="mt-2">
                      <details className="text-xs">
                        <summary className={`font-medium cursor-pointer ${connectionResult.success ? 'text-green-700' : 'text-red-700'}`}>
                          View Details
                        </summary>
                        <pre className="mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
                          {JSON.stringify(connectionResult.details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {smtpTestResult && (
            <div className={`mt-4 p-4 rounded-md ${smtpTestResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {smtpTestResult.success ? (
                    <Check className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${smtpTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {smtpTestResult.success ? 'SMTP Connection Successful' : 'SMTP Connection Failed'}
                  </h3>
                  <div className={`mt-2 text-sm ${smtpTestResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    <p>{smtpTestResult.message}</p>
                  </div>
                  
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
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Send Test Email</h4>
          <p className="text-sm text-gray-500 mb-4">
            Send a test email to verify your email sending configuration.
            {emailMethod === 'smtp' && ' Using SMTP relay method.'}
            {emailMethod === 'api' && ' Using Web API method.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow">
              <label htmlFor="testEmailTo" className="sr-only">Recipient Email</label>
              <input
                type="email"
                id="testEmailTo"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                placeholder="Enter recipient email address"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <button
              onClick={sendTestEmail}
              disabled={isSendingTest || !testEmailTo}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSendingTest ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
          
          {testEmailResult && (
            <div className={`mt-4 p-4 rounded-md ${testEmailResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {testEmailResult.success ? (
                    <Check className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${testEmailResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {testEmailResult.success ? 'Email Sent' : 'Email Failed'}
                  </h3>
                  <div className={`mt-2 text-sm ${testEmailResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    <p>{testEmailResult.message}</p>
                  </div>
                  
                  {testEmailResult.details && (
                    <div className="mt-2">
                      <details className="text-xs">
                        <summary className={`font-medium cursor-pointer ${testEmailResult.success ? 'text-green-700' : 'text-red-700'}`}>
                          View Details
                        </summary>
                        <pre className="mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
                          {JSON.stringify(testEmailResult.details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">SendGrid SMTP Configuration</h4>
          
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h5 className="text-sm font-medium text-blue-800 mb-2">SMTP Settings</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <p className="font-medium">Server:</p>
                <p className="font-mono">smtp.sendgrid.net</p>
              </div>
              <div>
                <p className="font-medium">Ports:</p>
                <p className="font-mono">25, 587 (TLS), 465 (SSL)</p>
              </div>
              <div>
                <p className="font-medium">Username:</p>
                <p className="font-mono">apikey</p>
              </div>
              <div>
                <p className="font-medium">Password:</p>
                <p className="font-mono">YOUR_API_KEY</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-blue-700">
              For production use, port 587 with TLS is recommended for better deliverability.
            </p>
          </div>
          
          <div className="mt-4 bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <h5 className="text-sm font-medium text-yellow-800 mb-2">Troubleshooting Checklist</h5>
            <ul className="text-sm text-yellow-700 space-y-2 list-disc pl-5">
              <li>
                <strong>API Key Issues:</strong> Ensure your SendGrid API key is correct and has the "Mail Send" permission
              </li>
              <li>
                <strong>Sender Verification:</strong> Your sender email domain must be verified in SendGrid
              </li>
              <li>
                <strong>SMTP Authentication:</strong> When using SMTP, the username is always "apikey" and the password is your API key
              </li>
              <li>
                <strong>Port Selection:</strong> If port 587 is blocked, try port 25 or 465
              </li>
              <li>
                <strong>CORS Issues:</strong> Browser security may block API calls - this is normal in development
              </li>
              <li>
                <strong>Spam Filters:</strong> Test emails may be caught by spam filters
              </li>
            </ul>
            <p className="mt-3 text-sm text-yellow-700">
              For production use, you should implement server-side email sending rather than client-side to avoid CORS issues and protect your API keys.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDebugger;