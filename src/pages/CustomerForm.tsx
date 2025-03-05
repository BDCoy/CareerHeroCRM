import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCustomerStore } from '../store/customerStore';
import CustomerFormComponent from '../components/CustomerForm';
import ResumeUploader from '../components/ResumeUploader';
import { Customer } from '../types';
import { ExtractedResumeInfo } from '../lib/openai';
import toast from 'react-hot-toast';

const CustomerFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const { 
    selectedCustomer, 
    loading, 
    error, 
    fetchCustomer, 
    addCustomer, 
    editCustomer 
  } = useCustomerStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  
  useEffect(() => {
    if (isEditMode && id) {
      fetchCustomer(id);
    }
  }, [isEditMode, id, fetchCustomer]);
  
  useEffect(() => {
    if (isEditMode && selectedCustomer) {
      setFormData(selectedCustomer);
    }
  }, [isEditMode, selectedCustomer]);
  
  const handleSubmit = async (data: Omit<Customer, 'id' | 'createdat' | 'updatedat'>) => {
    setIsSubmitting(true);
    try {
      // Merge with any data from resume
      const mergedData = {
        ...data,
        resumeurl: formData.resumeurl,
        resumedata: formData.resumedata
      };
      
      if (isEditMode && id) {
        await editCustomer(id, mergedData);
        toast.success('Customer updated successfully');
        navigate(`/customers/${id}`);
      } else {
        const newCustomer = await addCustomer(mergedData);
        toast.success('Customer added successfully');
        navigate(`/customers/${newCustomer.id}`);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResumeUpload = async (resumeUrl: string, resumeData: any, extractedInfo: ExtractedResumeInfo) => {
    console.log("Extracted info from resume upload:", extractedInfo);
    
    // Update form data with extracted info and resume data
    const updatedData = {
      ...formData,
      resumeurl: resumeUrl,
      resumedata: resumeData
    };
    
    // If we have extracted info, update the form data
    if (extractedInfo) {
      if (extractedInfo.firstname) updatedData.firstname = extractedInfo.firstname;
      if (extractedInfo.lastname) updatedData.lastname = extractedInfo.lastname;
      if (extractedInfo.email) updatedData.email = extractedInfo.email;
      if (extractedInfo.phone) updatedData.phone = extractedInfo.phone;
    }
    
    setFormData(updatedData);
    
    // If in edit mode, update the customer
    if (isEditMode && id) {
      try {
        await editCustomer(id, {
          resumeurl: resumeUrl,
          resumedata: resumeData,
          ...(extractedInfo.firstname && { firstname: extractedInfo.firstname }),
          ...(extractedInfo.lastname && { lastname: extractedInfo.lastname }),
          ...(extractedInfo.email && { email: extractedInfo.email }),
          ...(extractedInfo.phone && { phone: extractedInfo.phone })
        });
        toast.success('Resume uploaded and customer information updated');
      } catch (error) {
        console.error('Error updating customer with resume data:', error);
        toast.error('Failed to update customer with resume data');
      }
    } else {
      toast.success('Resume uploaded and information extracted');
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <Link to={isEditMode ? `/customers/${id}` : '/'} className="inline-flex items-center text-indigo-600 hover:text-indigo-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isEditMode ? 'Back to customer details' : 'Back to customers'}
        </Link>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {isEditMode ? 'Edit Customer' : 'Add New Customer'}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {isEditMode 
              ? 'Update customer information' 
              : 'Fill in the details to add a new customer to your CRM'}
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {error && (
            <div className="mb-4 bg-red-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {!isEditMode && (
            <ResumeUploader 
              onUploadComplete={handleResumeUpload}
              isNewCustomer={true}
            />
          )}
          
          <CustomerFormComponent
            initialData={formData}
            onSubmit={handleSubmit}
            isLoading={loading || isSubmitting}
          />
          
          {isEditMode && id && (
            <div className="mt-8 border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Resume Upload</h4>
              <p className="text-sm text-gray-500 mb-4">
                Upload a resume to automatically extract information about this customer.
                Supported formats: PDF, DOC, DOCX, and TXT.
              </p>
              <ResumeUploader 
                customerId={id} 
                onUploadComplete={handleResumeUpload} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerFormPage;