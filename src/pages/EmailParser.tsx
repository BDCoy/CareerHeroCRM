import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, UserPlus, ExternalLink, Info } from 'lucide-react';
import EmailReceiver from '../components/EmailReceiver';
import { Customer } from '../types';
import WebhookSetupGuide from '../components/WebhookSetupGuide';

const EmailParser: React.FC = () => {
  const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'simulator' | 'webhook'>('simulator');
  
  const handleCustomerCreated = (customer: Customer) => {
    setCreatedCustomer(customer);
  };
  
  return (
    <div>
      <div className="mb-6">
        <Link to="/email" className="inline-flex items-center text-indigo-600 hover:text-indigo-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Email Center
        </Link>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:px-6 border-b">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Email to Customer Parser
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Automatically create customers from incoming emails with resume attachments
          </p>
        </div>
        
        <div className="flex flex-wrap border-b overflow-x-auto">
          <button
            className={`py-3 px-4 whitespace-nowrap flex items-center ${activeTab === 'simulator' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('simulator')}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Simulator
          </button>
          <button
            className={`py-3 px-4 whitespace-nowrap flex items-center ${activeTab === 'webhook' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('webhook')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            Webhook Setup
          </button>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {activeTab === 'simulator' ? (
            <>
              <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Mail className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">How it works</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>This tool simulates receiving an email with a resume attachment and automatically creates a customer record from it.</p>
                      <ol className="list-decimal mt-2 ml-4 space-y-1">
                        <li>Enter a sender email address (simulating an incoming email)</li>
                        <li>Attach a resume file (PDF, DOC, DOCX, or TXT)</li>
                        <li>Click "Simulate Incoming Email" to process</li>
                        <li>The system will extract contact information and create a new customer</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
              
              <EmailReceiver onCustomerCreated={handleCustomerCreated} />
            </>
          ) : (
            <WebhookSetupGuide type="email" />
          )}
        </div>
      </div>
      
      {createdCustomer && activeTab === 'simulator' && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Customer Created Successfully
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                A new customer record has been created from the email attachment
              </p>
            </div>
            
            <Link
              to={`/dashboard/customers/${createdCustomer.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              View Customer
            </Link>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{createdCustomer.firstname} {createdCustomer.lastname}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{createdCustomer.email}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{createdCustomer.phone || 'Not detected'}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${createdCustomer.status === 'lead' ? 'bg-yellow-100 text-yellow-800' : 
                      createdCustomer.status === 'prospect' ? 'bg-blue-100 text-blue-800' : 
                      createdCustomer.status === 'customer' ? 'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-800'}`}
                  >
                    {createdCustomer.status.charAt(0).toUpperCase() + createdCustomer.status.slice(1)}
                  </span>
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Source</dt>
                <dd className="mt-1 text-sm text-gray-900">{createdCustomer.source}</dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{createdCustomer.notes}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailParser;