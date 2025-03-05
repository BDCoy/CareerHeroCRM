import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, FileText, Calendar, Briefcase, GraduationCap, Phone } from 'lucide-react';
import { useCustomerStore } from '../store/customerStore';
import { format } from 'date-fns';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedCustomer, loading, error, fetchCustomer, removeCustomer } = useCustomerStore();
  
  useEffect(() => {
    if (id) {
      fetchCustomer(id);
    }
  }, [id, fetchCustomer]);
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      if (id) {
        await removeCustomer(id);
        navigate('/');
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <div className="mt-4">
          <Link to="/" className="text-red-700 hover:text-red-600 font-medium">
            &larr; Back to customers
          </Link>
        </div>
      </div>
    );
  }
  
  if (!selectedCustomer) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-yellow-800">Customer not found</h3>
        <div className="mt-4">
          <Link to="/" className="text-yellow-700 hover:text-yellow-600 font-medium">
            &larr; Back to customers
          </Link>
        </div>
      </div>
    );
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'lead': return 'bg-yellow-100 text-yellow-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'customer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  console.log(selectedCustomer);
  
  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to customers
        </Link>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div className="mb-4 sm:mb-0 flex items-center">
            <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
              <span className="text-indigo-800 font-bold text-xl">
                {selectedCustomer.firstname.charAt(0)}{selectedCustomer.lastname.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-xl leading-6 font-medium text-gray-900">
                {selectedCustomer.firstname} {selectedCustomer.lastname}
              </h3>
              <div className="mt-1 flex items-center">
                <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusColor(selectedCustomer.status)}`}>
                  {selectedCustomer.status.charAt(0).toUpperCase() + selectedCustomer.status.slice(1)}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  Added on {format(new Date(selectedCustomer.createdat), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex space-x-1">
              {/* Email button */}
              <Link
                to={`/dashboard/customers/${id}/communicate`}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Email
              </Link>
              
              {/* SMS button */}
              <Link
                to={`/dashboard/customers/${id}/communicate?tab=sms`}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                SMS
              </Link>
              
              {/* WhatsApp button */}
              <Link
                to={`/dashboard/customers/${id}/communicate?tab=whatsapp`}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </Link>
            </div>
            
            <Link
              to={`/dashboard/customers/${id}/edit`}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Full name
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {selectedCustomer.firstname} {selectedCustomer.lastname}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Email address
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">
                {selectedCustomer.email}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Phone number
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {selectedCustomer.phone}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
                Status
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${getStatusColor(selectedCustomer.status)}`}
                >
                  {selectedCustomer.status.charAt(0).toUpperCase() + selectedCustomer.status.slice(1)}
                </span>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Source
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {selectedCustomer.source || '-'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                Created at
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {format(new Date(selectedCustomer.createdat), 'PPP')}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Notes
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                {selectedCustomer.notes || '-'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {Object.keys(selectedCustomer.resumedata).length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <FileText className="h-5 w-5 text-indigo-500 mr-2" />
              Resume Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Parsed from uploaded resume
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Summary</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {selectedCustomer.resumedata.summary}
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Skills</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.resumedata.skills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 mb-4 flex items-center">
                  <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                  Experience
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <ul className="divide-y divide-gray-200">
                    {selectedCustomer.resumedata.experience.map((exp, index) => (
                      <li key={index} className="py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            <Briefcase className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{exp.position}</p>
                            <p className="text-gray-500">{exp.company}</p>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>
                                {exp.startDate} - {exp.endDate || 'Present'}
                              </span>
                            </div>
                            <p className="mt-2">{exp.description}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 mb-4 flex items-center">
                  <GraduationCap className="h-4 w-4 text-gray-400 mr-2" />
                  Education
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <ul className="divide-y divide-gray-200">
                    {selectedCustomer.resumedata.education.map((edu, index) => (
                      <li key={index} className="py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            <GraduationCap className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{edu.degree} in {edu.field}</p>
                            <p className="text-gray-500">{edu.institution}</p>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>Graduated: {edu.graduationDate}</span>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;