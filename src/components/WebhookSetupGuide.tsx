import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Mail, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

interface WebhookSetupGuideProps {
  type?: 'email' | 'sms' | 'whatsapp';
}

const WebhookSetupGuide: React.FC<WebhookSetupGuideProps> = ({ type = 'email' }) => {
  const [copied, setCopied] = useState<string | null>(null);
  
  // Generate a sample webhook URL
  const baseUrl = window.location.origin;
  const webhookUrls = {
    email: `${baseUrl}/api/webhooks/sendgrid/inbound`,
    sms: `${baseUrl}/api/webhooks/twilio/sms`,
    whatsapp: `${baseUrl}/api/webhooks/twilio/whatsapp`
  };
  
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(null), 2000);
    });
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          {type === 'email' ? (
            <Mail className="h-5 w-5 text-indigo-500 mr-2" />
          ) : (
            <MessageSquare className="h-5 w-5 text-indigo-500 mr-2" />
          )}
          {type === 'email' ? 'Email Webhook Setup Guide' : 
           type === 'sms' ? 'SMS Webhook Setup Guide' : 
           'WhatsApp Webhook Setup Guide'}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {type === 'email' ? 
            'Configure SendGrid Inbound Parse to automatically process incoming emails with resumes' : 
            'Configure Twilio to handle incoming messages'}
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        <div className="space-y-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">Step 1: Set up your domain</h4>
            {type === 'email' ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Configure a subdomain (e.g., <code>parse.yourcompany.com</code>) to receive emails for parsing.
                </p>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">DNS Configuration</h5>
                  <p className="text-sm text-gray-600 mb-2">
                    Add these DNS records to your domain:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Host</th>
                          <th className="px-4 py-2 text-left">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-2 border-t">MX</td>
                          <td className="px-4 py-2 border-t">parse</td>
                          <td className="px-4 py-2 border-t">mx.sendgrid.net</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border-t">CNAME</td>
                          <td className="px-4 py-2 border-t">email</td>
                          <td className="px-4 py-2 border-t">sendgrid.net</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Purchase a phone number from Twilio that supports {type === 'sms' ? 'SMS' : 'WhatsApp'} capabilities.
              </p>
            )}
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">
              Step 2: Configure {type === 'email' ? 'SendGrid Inbound Parse' : 'Twilio Webhook URL'}
            </h4>
            <div className="space-y-2">
              {type === 'email' ? (
                <>
                  <p className="text-sm text-gray-600">
                    In your SendGrid dashboard, go to Settings &gt; Inbound Parse and set up a new webhook:
                  </p>
                  <ol className="list-decimal ml-5 text-sm text-gray-600 space-y-2">
                    <li>Enter your subdomain (e.g., <code>parse.yourcompany.com</code>)</li>
                    <li>Set the destination URL to your webhook endpoint</li>
                    <li>Enable "Check incoming emails for attachments"</li>
                    <li>Save the configuration</li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    In your Twilio dashboard, configure the webhook URL for your phone number:
                  </p>
                  <ol className="list-decimal ml-5 text-sm text-gray-600 space-y-2">
                    <li>Go to Phone Numbers &gt; Manage &gt; Active Numbers</li>
                    <li>Select your phone number</li>
                    <li>Under "{type === 'sms' ? 'Messaging' : 'WhatsApp'}", set the webhook URL</li>
                    <li>Save the configuration</li>
                  </ol>
                </>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">Step 3: Webhook URL</h4>
            <p className="text-sm text-gray-600 mb-2">
              Use this webhook URL in your {type === 'email' ? 'SendGrid' : 'Twilio'} configuration:
            </p>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-50 p-3 rounded-l-md border border-r-0 border-gray-300 font-mono text-sm overflow-x-auto">
                {webhookUrls[type]}
              </div>
              <button
                onClick={() => copyToClipboard(webhookUrls[type], 'webhook-url')}
                className="p-3 bg-gray-100 border border-gray-300 rounded-r-md hover:bg-gray-200"
                title="Copy to clipboard"
              >
                {copied === 'webhook-url' ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          
          {type === 'email' && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Step 4: Test the Integration</h4>
              <p className="text-sm text-gray-600 mb-2">
                Send a test email with a resume attachment to <code>parse@yoursubdomain.com</code> to verify the setup.
              </p>
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <h5 className="text-sm font-medium text-blue-800 mb-2">Sample Email Format</h5>
                <div className="bg-white p-3 rounded border border-blue-100 text-sm">
                  <p><strong>To:</strong> parse@yoursubdomain.com</p>
                  <p><strong>Subject:</strong> Resume for consideration</p>
                  <p><strong>Body:</strong> Please find attached my resume for your consideration.</p>
                  <p><strong>Attachment:</strong> resume.pdf</p>
                </div>
              </div>
            </div>
          )}
          
          {(type === 'sms' || type === 'whatsapp') && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Step 4: Test the Integration</h4>
              <p className="text-sm text-gray-600 mb-2">
                Send a test message to your Twilio phone number to verify the webhook is working.
              </p>
              <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
                <h5 className="text-sm font-medium text-purple-800 mb-2">Expected Response</h5>
                <p className="text-sm text-purple-700">
                  When you send a message, you should receive an automated reply: "Thank you for your message. We'll get back to you soon."
                </p>
              </div>
            </div>
          )}
          
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">Implementation Details</h4>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Server-side Code</h5>
              <p className="text-sm text-gray-600 mb-2">
                Your server needs to implement an endpoint to handle the webhook requests:
              </p>
              <div className="bg-gray-800 text-gray-200 p-3 rounded overflow-x-auto">
                <pre className="text-xs">
                  {type === 'email' ? `// Express.js example
app.post('/api/webhooks/sendgrid/inbound', (req, res) => {
  // Extract email data from req.body
  const { from, to, subject, text, attachments } = req.body;
  
  // Process attachments and create customer if it's a resume
  // ...
  
  res.status(200).send('OK');
});` : 
                  `// Express.js example
app.post('/api/webhooks/twilio/${type}', (req, res) => {
  // Extract message data from req.body
  const { From, Body, MessageSid } = req.body;
  
  // Process the incoming message
  // ...
  
  // Return TwiML response
  res.set('Content-Type', 'text/xml');
  res.send(\`
    <Response>
      <Message>Thank you for your message. We'll get back to you soon.</Message>
    </Response>
  \`);
});`}
                </pre>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">Additional Resources</h4>
            <ul className="space-y-2">
              {type === 'email' ? (
                <>
                  <li>
                    <a 
                      href="https://docs.sendgrid.com/for-developers/parsing-email/inbound-email" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                    >
                      SendGrid Inbound Parse Documentation
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                    >
                      Setting Up the Inbound Parse Webhook
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <a 
                      href={`https://www.twilio.com/docs/${type === 'sms' ? 'sms' : 'whatsapp'}/webhooks`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                    >
                      Twilio {type === 'sms' ? 'SMS' : 'WhatsApp'} Webhooks Documentation
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://www.twilio.com/docs/usage/webhooks" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                    >
                      Twilio Webhooks Guide
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </li>
                </>
              )}
              <li>
                <a 
                  href="https://ngrok.com/docs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                >
                  ngrok Documentation (for testing webhooks locally)
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookSetupGuide;