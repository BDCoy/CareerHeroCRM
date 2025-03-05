import React from 'react';
import { format } from 'date-fns';
import { Mail, MessageSquare, Check, AlertCircle } from 'lucide-react';
import { Communication } from '../types';

interface CommunicationHistoryProps {
  communications: Communication[];
  isLoading: boolean;
}

const CommunicationHistory: React.FC<CommunicationHistoryProps> = ({ communications, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (communications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No communication history yet.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {communications.map((comm) => (
        <div key={comm.id} className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <div className="flex items-start">
              {comm.type === 'email' ? (
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-3">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
              ) : comm.type === 'whatsapp' ? (
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mr-3">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 text-green-600" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mr-3">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                </div>
              )}
              <div>
                <div className="flex items-center flex-wrap">
                  <span className="font-medium">
                    {comm.type === 'email' ? 'Email' : comm.type === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                  </span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(comm.sentat), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p className="mt-1 text-gray-800 whitespace-pre-wrap break-words">{comm.content}</p>
              </div>
            </div>
            <div className="flex items-center mt-2 sm:mt-0">
              {comm.status === 'sent' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Check className="h-3 w-3 mr-1" />
                  Sent
                </span>
              )}
              {comm.status === 'delivered' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Check className="h-3 w-3 mr-1" />
                  Delivered
                </span>
              )}
              {comm.status === 'failed' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Failed
                </span>
              )}
              {comm.status === 'received' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Check className="h-3 w-3 mr-1" />
                  Received
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommunicationHistory;