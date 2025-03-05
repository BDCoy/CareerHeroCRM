import React from 'react';
import { Check, AlertCircle, ExternalLink } from 'lucide-react';

interface SmsSendConfirmationProps {
  success: boolean;
  message: string;
  details?: any;
  onClose: () => void;
}

const SmsSendConfirmation: React.FC<SmsSendConfirmationProps> = ({ 
  success, 
  message, 
  details,
  onClose
}) => {
  return (
    <div className={`p-4 rounded-md ${success ? 'bg-purple-50 border border-purple-200' : 'bg-red-50 border border-red-200'}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {success ? (
            <Check className="h-5 w-5 text-purple-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-400" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${success ? 'text-purple-800' : 'text-red-800'}`}>
            {success ? 'SMS Sent Successfully' : 'SMS Sending Failed'}
          </h3>
          <div className={`mt-2 text-sm ${success ? 'text-purple-700' : 'text-red-700'}`}>
            <p>{message}</p>
          </div>
          
          {success && details && (
            <div className="mt-3 text-sm">
              <p className="text-purple-700">
                The SMS was sent using Twilio's messaging API.
              </p>
              {details.twilioResponse && (
                <div className="mt-2">
                  <details className="text-xs">
                    <summary className="font-medium cursor-pointer text-purple-700">
                      View Twilio Response
                    </summary>
                    <pre className="mt-1 p-2 bg-white rounded overflow-x-auto border border-purple-100">
                      {JSON.stringify(details.twilioResponse, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
              <div className="mt-2">
                <a 
                  href="https://www.twilio.com/console/sms/logs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-purple-700 hover:text-purple-900"
                >
                  View in Twilio Dashboard
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex items-center px-3 py-1.5 border ${success ? 'border-purple-300 text-purple-700 hover:bg-purple-50' : 'border-red-300 text-red-700 hover:bg-red-50'} rounded-md text-sm leading-4 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${success ? 'focus:ring-purple-500' : 'focus:ring-red-500'}`}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmsSendConfirmation;