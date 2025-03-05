import React, { useEffect, useState } from 'react';
import { useCustomerStore } from '../store/customerStore';
import { useCommunicationStore } from '../store/communicationStore';
import { BarChart2, Users, MessageSquare, Mail, TrendingUp, UserPlus } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { customers, loading: customersLoading, fetchCustomers } = useCustomerStore();
  
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  
  // Calculate customer statistics
  const customerStats = {
    total: customers.length,
    leads: customers.filter(c => c.status === 'lead').length,
    prospects: customers.filter(c => c.status === 'prospect').length,
    customers: customers.filter(c => c.status === 'customer').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
  };
  
  // Calculate customer growth (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newCustomers = customers.filter(c => new Date(c.createdat) >= thirtyDaysAgo).length;
  
  // Mock communication statistics
  const communicationStats = {
    totalEmails: 124,
    totalSMS: 87,
    totalWhatsApp: 56,
    lastMonth: 78,
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      {customersLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{customerStats.total}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <UserPlus className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">New Customers (30d)</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{newCustomers}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Emails Sent</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{communicationStats.totalEmails}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Messages Sent</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {communicationStats.totalSMS + communicationStats.totalWhatsApp}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Customer Distribution
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="h-64 flex items-end justify-around">
                  <div className="flex flex-col items-center">
                    <div className="bg-yellow-500 w-12 sm:w-16 rounded-t-md" 
                      style={{ height: `${(customerStats.leads / Math.max(customerStats.total, 1)) * 200}px` }}></div>
                    <div className="mt-2 text-sm font-medium text-gray-600">Leads</div>
                    <div className="text-lg font-semibold text-gray-900">{customerStats.leads}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-blue-500 w-12 sm:w-16 rounded-t-md" 
                      style={{ height: `${(customerStats.prospects / Math.max(customerStats.total, 1)) * 200}px` }}></div>
                    <div className="mt-2 text-sm font-medium text-gray-600">Prospects</div>
                    <div className="text-lg font-semibold text-gray-900">{customerStats.prospects}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-green-500 w-12 sm:w-16 rounded-t-md" 
                      style={{ height: `${(customerStats.customers / Math.max(customerStats.total, 1)) * 200}px` }}></div>
                    <div className="mt-2 text-sm font-medium text-gray-600">Customers</div>
                    <div className="text-lg font-semibold text-gray-900">{customerStats.customers}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-gray-500 w-12 sm:w-16 rounded-t-md" 
                      style={{ height: `${(customerStats.inactive / Math.max(customerStats.total, 1)) * 200}px` }}></div>
                    <div className="mt-2 text-sm font-medium text-gray-600">Inactive</div>
                    <div className="text-lg font-semibold text-gray-900">{customerStats.inactive}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Communication Overview
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="h-64 flex items-end justify-around">
                  <div className="flex flex-col items-center">
                    <div className="bg-indigo-500 w-12 sm:w-16 rounded-t-md" 
                      style={{ height: '120px' }}></div>
                    <div className="mt-2 text-sm font-medium text-gray-600">Emails</div>
                    <div className="text-lg font-semibold text-gray-900">{communicationStats.totalEmails}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-purple-500 w-12 sm:w-16 rounded-t-md" 
                      style={{ height: '80px' }}></div>
                    <div className="mt-2 text-sm font-medium text-gray-600">SMS</div>
                    <div className="text-lg font-semibold text-gray-900">{communicationStats.totalSMS}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-green-500 w-12 sm:w-16 rounded-t-md" 
                      style={{ height: '60px' }}></div>
                    <div className="mt-2 text-sm font-medium text-gray-600">WhatsApp</div>
                    <div className="text-lg font-semibold text-gray-900">{communicationStats.totalWhatsApp}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;