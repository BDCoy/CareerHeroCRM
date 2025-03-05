import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, Filter, Search } from 'lucide-react';
import { useCommunicationStore } from '../store/communicationStore';
import { useCustomerStore } from '../store/customerStore';
import { format } from 'date-fns';

const Communications: React.FC = () => {
  const { customers, fetchCustomers } = useCustomerStore();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [communicationType, setCommunicationType] = useState<'all' | 'email' | 'sms' | 'whatsapp'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get all communications from all customers
  const [allCommunications, setAllCommunications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  
  useEffect(() => {
    const fetchAllCommunications = async () => {
      setIsLoading(true);
      try {
        // For demo purposes, we'll create some mock communications
        const mockCommunications = [];
        
        // Generate some mock communications for each customer
        for (const customer of customers) {
          // Email communications
          mockCommunications.push({
            id: `email-${customer.id}-1`,
            customerid: customer.id,
            customername: `${customer.firstname} ${customer.lastname}`,
            type: 'email',
            content: `Subject: Follow-up on our conversation\n\nHello ${customer.firstname},\n\nThank you for your interest in our products. I wanted to follow up on our conversation from last week.`,
            sentat: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'sent'
          });
          
          // SMS communications
          if (Math.random() > 0.3) {
            mockCommunications.push({
              id: `sms-${customer.id}-1`,
              customerid: customer.id,
              customername: `${customer.firstname} ${customer.lastname}`,
              type: 'sms',
              content: `Hi ${customer.firstname}, just a reminder about our meeting tomorrow at 2pm. Looking forward to it!`,
              sentat: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'delivered'
            });
          }
          
          // WhatsApp communications
          if (Math.random() > 0.6) {
            mockCommunications.push({
              id: `whatsapp-${customer.id}-1`,
              customerid: customer.id,
              customername: `${customer.firstname} ${customer.lastname}`,
              type: 'whatsapp',
              content: `Hello ${customer.firstname}, I've sent you the proposal via email. Let me know if you have any questions!`,
              sentat: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'sent'
            });
          }
        }
        
        // Sort by date, newest first
        mockCommunications.sort((a, b) => new Date(b.sentat).getTime() - new Date(a.sentat).getTime());
        
        setAllCommunications(mockCommunications);
      } catch (error) {
        console.error('Error fetching communications:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (customers.length > 0) {
      fetchAllCommunications();
    }
  }, [customers]);
  
  // Filter communications based on selected filters
  const filteredCommunications = allCommunications.filter(comm => {
    const matchesCustomer = selectedCustomerId === 'all' || comm.customerid === selectedCustomerId;
    const matchesType = communicationType === 'all' || comm.type === communicationType;
    const matchesSearch = comm.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         comm.customername.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCustomer && matchesType && matchesSearch;
  });
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5 text-indigo-500" />;
      case 'sms':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case 'whatsapp':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-green-500" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        );
      default:
        return <Mail className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Communications</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search communications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm"
              />
            </div>
            
            <div className="flex space-x-4">
              <div>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Customers</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.firstname} {customer.lastname}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <select
                  value={communicationType}
                  onChange={(e) => setCommunicationType(e.target.value as any)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Types</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredCommunications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No communications found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCommunications.map((comm) => (
              <div key={comm.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(comm.type)}
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center">
                        <Link to={`/customers/${comm.customerid}`} className="font-medium text-indigo-600 hover:text-indigo-900">
                          {comm.customername}
                        </Link>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(comm.sentat), 'MMM d, yyyy h:mm a')}
                        </span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-sm font-medium capitalize">
                          {comm.type}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-800 whitespace-pre-wrap line-clamp-2">
                        {comm.content}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {comm.status === 'sent' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Sent
                      </span>
                    )}
                    {comm.status === 'delivered' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Delivered
                      </span>
                    )}
                    {comm.status === 'failed' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Failed
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <Link
                    to={`/customers/${comm.customerid}/communicate`}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Send new message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Communications;