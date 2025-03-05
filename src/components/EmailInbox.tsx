import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Mail, Search, Filter, RefreshCw, Eye, Reply, Trash2, Star, Clock } from 'lucide-react';
import { fetchReceivedEmails, markEmailAsRead } from '../lib/emailService';
import { Communication } from '../types';
import { useCustomerStore } from '../store/customerStore';

interface EmailInboxProps {
  customerId?: string;
  onReply?: (email: Communication) => void;
}

const EmailInbox: React.FC<EmailInboxProps> = ({ customerId, onReply }) => {
  const [emails, setEmails] = useState<Communication[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<Communication[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Communication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [showEmailContent, setShowEmailContent] = useState(false);
  const { customers, fetchCustomers } = useCustomerStore();
  
  // Fetch emails on component mount
  useEffect(() => {
    fetchCustomers();
    loadEmails();
  }, [customerId, fetchCustomers]);
  
  // Filter emails when search term or filter changes
  useEffect(() => {
    filterEmails();
  }, [emails, searchTerm, filter]);
  
  const loadEmails = async () => {
    setIsLoading(true);
    try {
      const fetchedEmails = await fetchReceivedEmails(customerId);
      setEmails(fetchedEmails);
      
      // If there are emails and none is selected, select the first one
      if (fetchedEmails.length > 0 && !selectedEmail) {
        setSelectedEmail(fetchedEmails[0]);
        
        // Mark the email as read if it's not already
        if (fetchedEmails[0].metadata?.isRead === false) {
          await markEmailAsRead(fetchedEmails[0].id);
          // Update the email in the list
          setEmails(prevEmails => 
            prevEmails.map(email => 
              email.id === fetchedEmails[0].id 
                ? { ...email, metadata: { ...email.metadata, isRead: true } } 
                : email
            )
          );
        }
      }
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterEmails = () => {
    let filtered = [...emails];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(email => 
        email.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.metadata?.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.metadata?.to?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply read/unread filter
    if (filter === 'unread') {
      filtered = filtered.filter(email => email.metadata?.isRead === false);
    } else if (filter === 'read') {
      filtered = filtered.filter(email => email.metadata?.isRead === true);
    }
    
    setFilteredEmails(filtered);
  };
  
  const handleSelectEmail = async (email: Communication) => {
    setSelectedEmail(email);
    setShowEmailContent(true);
    
    // Mark the email as read if it's not already
    if (email.metadata?.isRead === false) {
      await markEmailAsRead(email.id);
      // Update the email in the list
      setEmails(prevEmails => 
        prevEmails.map(e => 
          e.id === email.id 
            ? { ...e, metadata: { ...e.metadata, isRead: true } } 
            : e
        )
      );
    }
  };
  
  const handleRefresh = () => {
    loadEmails();
  };
  
  const handleReply = () => {
    if (selectedEmail && onReply) {
      onReply(selectedEmail);
      setShowEmailContent(false);
    }
  };
  
  const handleBackToList = () => {
    setShowEmailContent(false);
  };
  
  // Extract subject and body from email content
  const parseEmailContent = (content: string) => {
    const subjectMatch = content.match(/Subject: (.*?)(?:\n|$)/);
    const subject = subjectMatch ? subjectMatch[1] : 'No Subject';
    
    const bodyStart = content.indexOf('\n\n');
    const body = bodyStart !== -1 ? content.substring(bodyStart + 2) : content;
    
    return { subject, body };
  };
  
  // Find customer name by ID
  const getCustomerName = (id: string) => {
    const customer = customers.find(c => c.id === id);
    return customer ? `${customer.firstname} ${customer.lastname}` : 'Unknown Customer';
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="border-b border-gray-200">
        <div className="p-4 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Email Inbox</h3>
          <button 
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm"
              />
            </div>
            
            <div className="flex items-center">
              <Filter className="h-4 w-4 text-gray-500 mr-2" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="md:flex md:flex-row h-[600px]">
        {/* Email list - always visible on desktop, hidden on mobile when viewing email */}
        <div className={`${showEmailContent ? 'hidden' : 'block'} md:block md:w-full md:w-1/3 border-r border-gray-200 overflow-y-auto`}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Mail className="h-12 w-12 mb-2" />
              <p>No emails found</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredEmails.map((email) => {
                const { subject } = parseEmailContent(email.content);
                const isRead = email.metadata?.isRead === true;
                const isSelected = selectedEmail?.id === email.id;
                
                return (
                  <li 
                    key={email.id}
                    className={`
                      hover:bg-gray-50 cursor-pointer
                      ${isSelected ? 'bg-indigo-50' : ''}
                      ${!isRead ? 'bg-blue-50' : ''}
                    `}
                    onClick={() => handleSelectEmail(email)}
                  >
                    <div className="px-4 py-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          {!isRead && (
                            <div className="h-2 w-2 bg-blue-600 rounded-full mr-2"></div>
                          )}
                          <span className={`font-medium truncate max-w-[150px] sm:max-w-[200px] ${!isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                            {email.metadata?.from || 'Unknown Sender'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(email.sentat), 'MMM d')}
                        </span>
                      </div>
                      <div className="mt-1">
                        <p className={`text-sm truncate ${!isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                          {subject}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        
        {/* Email content - always visible on desktop, conditionally visible on mobile */}
        <div className={`${showEmailContent ? 'block' : 'hidden'} md:block md:w-full md:w-2/3 overflow-y-auto`}>
          {selectedEmail ? (
            <div className="p-4">
              {/* Mobile back button */}
              <button 
                onClick={handleBackToList}
                className="md:hidden mb-4 inline-flex items-center text-indigo-600"
              >
                ← Back to inbox
              </button>
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 truncate max-w-[200px] sm:max-w-full">
                  {parseEmailContent(selectedEmail.content).subject}
                </h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleReply}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                    title="Reply"
                  >
                    <Reply size={16} />
                  </button>
                  <button 
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button 
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                    title="Mark as important"
                  >
                    <Star size={16} />
                  </button>
                </div>
              </div>
              
              <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">From:</span> {selectedEmail.metadata?.from || 'Unknown Sender'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">To:</span> {selectedEmail.metadata?.to || 'crm@example.com'}
                  </p>
                  {selectedEmail.customerid && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Customer:</span> {getCustomerName(selectedEmail.customerid)}
                    </p>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-2 sm:mt-0">
                  <Clock size={14} className="mr-1" />
                  {format(new Date(selectedEmail.sentat), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap break-words">{parseEmailContent(selectedEmail.content).body}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Mail className="h-12 w-12 mb-2" />
              <p>Select an email to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailInbox;