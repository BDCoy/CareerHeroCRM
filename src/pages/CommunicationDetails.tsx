import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, Calendar, User, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Communication } from '../types';

const CommunicationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [communication, setCommunication] = useState<Communication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');

  useEffect(() => {
    const fetchCommunication = async () => {
      try {
        if (!id) return;

        const { data: commData, error: commError } = await supabase
          .from('communications')
          .select('*')
          .eq('id', id)
          .single();

        if (commError) throw commError;
        if (!commData) throw new Error('Communication not found');

        setCommunication(commData);

        // Fetch customer name if customerid exists
        if (commData.customerid) {
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('firstname, lastname')
            .eq('id', commData.customerid)
            .single();

          if (!customerError && customerData) {
            setCustomerName(`${customerData.firstname} ${customerData.lastname}`);
          }
        }
      } catch (error) {
        console.error('Error fetching communication:', error);
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunication();
  }, [id]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-6 w-6 text-indigo-500" />;
      case 'sms':
        return <MessageSquare className="h-6 w-6 text-purple-500" />;
      case 'whatsapp':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 text-green-500" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        );
      default:
        return <Mail className="h-6 w-6 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !communication) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="mt-2 text-sm text-red-700">{error || 'Communication not found'}</p>
        <div className="mt-4">
          <Link to="/dashboard/communications" className="text-red-700 hover:text-red-600 font-medium">
            &larr; Back to communications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/dashboard/communications" className="inline-flex items-center text-indigo-600 hover:text-indigo-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to communications
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b">
          <div className="flex items-center">
            {getTypeIcon(communication.type)}
            <h3 className="ml-2 text-lg leading-6 font-medium text-gray-900 capitalize">
              {communication.type} Details
            </h3>
          </div>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Sent/Received At
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(communication.sentat), 'PPpp')}
                </dd>
              </div>
            </div>

            {customerName && (
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Customer
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <Link 
                      to={`/dashboard/customers/${communication.customerid}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {customerName}
                    </Link>
                  </dd>
                </div>
              </div>
            )}

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  {communication.status === 'sent' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="h-4 w-4 mr-1" />
                      Sent
                    </span>
                  )}
               
                  {communication.status === 'received' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Check className="h-4 w-4 mr-1" />
                      Received
                    </span>
                  )}
                </dd>
              </div>
            </div>

            {communication.metadata && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Metadata</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <div className="bg-gray-50 rounded-md p-4 space-y-2">
                    {communication.metadata.from && (
                      <div className="flex justify-between">
                        <span className="font-medium">From:</span>
                        <span>{communication.metadata.from}</span>
                      </div>
                    )}
                    {communication.metadata.to && (
                      <div className="flex justify-between">
                        <span className="font-medium">To:</span>
                        <span>{communication.metadata.to}</span>
                      </div>
                    )}
                    {communication.metadata.cc && communication.metadata.cc.length > 0 && (
                      <div className="flex justify-between">
                        <span className="font-medium">CC:</span>
                        <span>{communication.metadata.cc.join(', ')}</span>
                      </div>
                    )}
                    {communication.metadata.bcc && communication.metadata.bcc.length > 0 && (
                      <div className="flex justify-between">
                        <span className="font-medium">BCC:</span>
                        <span>{communication.metadata.bcc.join(', ')}</span>
                      </div>
                    )}
                    {communication.metadata.hasAttachments && (
                      <div className="flex justify-between">
                        <span className="font-medium">Attachments:</span>
                        <span>Yes</span>
                      </div>
                    )}
                  </div>
                </dd>
              </div>
            )}

            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Content</dt>
              <dd className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-4 whitespace-pre-wrap">
                {communication.content}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default CommunicationDetails;