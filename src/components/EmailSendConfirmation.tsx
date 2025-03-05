import React from 'react';
import { Check, AlertCircle, ExternalLink } from 'lucide-react';

interface EmailSendConfirmationProps {
  success: boolean;
  message: string;
  details?: any;
  onClose: () => void;
}

const EmailSendConfirmation: React.FC<EmailSendConfirmationProps> = ({ 
  success, 
  message, 
  details,
  onClose
}) => {
  return (
    <div className={`p-4 rounded-md ${success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {success ? (
            <Check className="h-5 w-5 text-green-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-400" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${success ? 'text-green-800' : 'text-red-800'}`}>
            {success ? 'Email Sent Successfully' : 'Email Sending Failed'}
          </h3>
          <div className={`mt-2 text-sm ${success ? 'text-green-700' : 'text-red-700'}`}>
            <p>{message}</p>
          </div>
          
          {success && (
            <div className="mt-3 text-sm">
              <p className="text-green-700">
                The email was sent using SendGrid's {details?.method === 'smtp' ? 'SMTP Relay' : 'Web API'}.
              </p>
              {details?.sendgridResponse && (
                <div className="mt-2">
                  <details className="text-xs">
                    <summary className="font-medium cursor-pointer text-green-700">
                      View SendGrid Response
                    </summary>
                    <pre className="mt-1 p-2 bg-white rounded overflow-x-auto border border-green-100">
                      {JSON.stringify(details.sendgridResponse, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
              <div className="mt-2">
                <a 
                  href="https://app.sendgrid.com/email_activity" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-green-700 hover:text-green-900"
                >
                  View in SendGrid Dashboard
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex items-center px-3 py-1.5 border ${success ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-red-700 hover:bg-red-50'} rounded-md text-sm leading-4 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${success ? 'focus:ring-green-500' : 'focus:ring-red-500'}`}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSendConfirmation;