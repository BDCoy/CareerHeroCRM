import React, { useEffect, useState } from 'react';
import { useCustomerStore } from '../store/customerStore';
import { useCommunicationStore } from '../store/communicationStore';
import { BarChart2, Users, MessageSquare, Mail, TrendingUp, UserPlus, Calendar } from 'lucide-react';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const Dashboard: React.FC = () => {
  const { customers, loading: customersLoading, fetchCustomers } = useCustomerStore();
  const { communications, loading: commsLoading, fetchAllCommunications } = useCommunicationStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  
  useEffect(() => {
    fetchCustomers();
    fetchAllCommunications();
  }, [fetchCustomers, fetchAllCommunications]);

  // Calculate date range based on selected period
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = subDays(endDate, selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90);
    return { startDate, endDate };
  };

  // Calculate customer statistics
  const customerStats = {
    total: customers.length,
    leads: customers.filter(c => c.status === 'lead').length,
    prospects: customers.filter(c => c.status === 'prospect').length,
    activeCustomers: customers.filter(c => c.status === 'customer').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
  };

  // Calculate new customers in selected period
  const { startDate, endDate } = getDateRange();
  const newCustomers = customers.filter(c => {
    const createDate = new Date(c.createdat);
    return isWithinInterval(createDate, { start: startOfDay(startDate), end: endOfDay(endDate) });
  }).length;

  // Calculate communication statistics
  const communicationStats = {
    totalEmails: communications.filter(c => c.type === 'email').length,
    totalWhatsApp: communications.filter(c => c.type === 'whatsapp').length,
    recentEmails: communications.filter(c => 
      c.type === 'email' && 
      isWithinInterval(new Date(c.sentat), { start: startOfDay(startDate), end: endOfDay(endDate) })
    ).length,
    recentWhatsApp: communications.filter(c => 
      c.type === 'whatsapp' && 
      isWithinInterval(new Date(c.sentat), { start: startOfDay(startDate), end: endOfDay(endDate) })
    ).length,
  };

  // Calculate daily stats for the chart
  const getDailyStats = () => {
    const stats = Array.from({ length: selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90 }, (_, i) => {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      return {
        date: format(date, 'MMM dd'),
        customers: customers.filter(c => 
          isWithinInterval(new Date(c.createdat), { start: dayStart, end: dayEnd })
        ).length,
        communications: communications.filter(c => 
          isWithinInterval(new Date(c.sentat), { start: dayStart, end: dayEnd })
        ).length
      };
    }).reverse();

    return stats;
  };

  const dailyStats = getDailyStats();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedPeriod('7d')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              selectedPeriod === '7d' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setSelectedPeriod('30d')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              selectedPeriod === '30d' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setSelectedPeriod('90d')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              selectedPeriod === '90d' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {(customersLoading || commsLoading) ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {/* Total Customers */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{customerStats.total}</div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <TrendingUp className="self-center flex-shrink-0 h-4 w-4 text-green-500" aria-hidden="true" />
                        <span className="sr-only">Increased by</span>
                        {newCustomers} new
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Active Customers */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <UserPlus className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Customers</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{customerStats.activeCustomers}</div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        {((customerStats.activeCustomers / customerStats.total) * 100).toFixed(1)}%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Total Messages */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Messages</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {communicationStats.totalWhatsApp}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-purple-600">
                        +{communicationStats.recentWhatsApp} new
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Total Emails */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Emails</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {communicationStats.totalEmails}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-blue-600">
                        +{communicationStats.recentEmails} new
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Customer Distribution */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-2" />
                  Customer Distribution
                </h3>
              </div>
              <div className="p-6">
                <div className="h-64 flex items-end justify-around">
                  <div className="flex flex-col items-center">
                    <div 
                      className="bg-yellow-500 w-16 rounded-t-md transition-all duration-500" 
                      style={{ height: `${(customerStats.leads / Math.max(customerStats.total, 1)) * 200}px` }}
                    ></div>
                    <div className="mt-2 text-sm font-medium text-gray-600">Leads</div>
                    <div className="text-lg font-semibold text-gray-900">{customerStats.leads}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div 
                      className="bg-blue-500 w-16 rounded-t-md transition-all duration-500" 
                      style={{ height: `${(customerStats.prospects / Math.max(customerStats.total, 1)) * 200}px` }}
                    ></div>
                    <div className="mt-2 text-sm font-medium text-gray-600">Prospects</div>
                    <div className="text-lg font-semibold text-gray-900">{customerStats.prospects}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div 
                      className="bg-green-500 w-16 rounded-t-md transition-all duration-500" 
                      style={{ height: `${(customerStats.activeCustomers / Math.max(customerStats.total, 1)) * 200}px` }}
                    ></div>
                    <div className="mt-2 text-sm font-medium text-gray-600">Customers</div>
                    <div className="text-lg font-semibold text-gray-900">{customerStats.activeCustomers}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div 
                      className="bg-gray-500 w-16 rounded-t-md transition-all duration-500" 
                      style={{ height: `${(customerStats.inactive / Math.max(customerStats.total, 1)) * 200}px` }}
                    ></div>
                    <div className="mt-2 text-sm font-medium text-gray-600">Inactive</div>
                    <div className="text-lg font-semibold text-gray-900">{customerStats.inactive}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  Activity Timeline
                </h3>
              </div>
              <div className="p-6">
                <div className="h-64">
                  <div className="relative h-full">
                    {/* Y-axis */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
                      <span>10</span>
                      <span>8</span>
                      <span>6</span>
                      <span>4</span>
                      <span>2</span>
                      <span>0</span>
                    </div>
                    
                    {/* Chart area */}
                    <div className="ml-12 h-full flex items-end">
                      <div className="flex-1 h-full flex items-end">
                        {dailyStats.map((stat, index) => (
                          <div 
                            key={index} 
                            className="flex-1 flex flex-col items-center justify-end h-full"
                          >
                            <div className="w-full px-1">
                              <div 
                                className="bg-indigo-500 rounded-t transition-all duration-500"
                                style={{ height: `${(stat.customers * 10)}%` }}
                              ></div>
                              <div 
                                className="bg-green-500 rounded-t transition-all duration-500 mt-1"
                                style={{ height: `${(stat.communications * 10)}%` }}
                              ></div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500 -rotate-45 origin-top-left">
                              {stat.date}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="mt-4 flex justify-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-indigo-500 rounded mr-2"></div>
                    <span className="text-sm text-gray-600">New Customers</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                    <span className="text-sm text-gray-600">Communications</span>
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