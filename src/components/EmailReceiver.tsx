import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Mail, Upload, FileText, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { simulateIncomingEmail, EmailAttachment } from '../lib/emailParser';
import { Customer } from '../types';
import toast from 'react-hot-toast';

interface EmailReceiverProps {
  onCustomerCreated?: (customer: Customer) => void;
}

const EmailReceiver: React.FC<EmailReceiverProps> = ({ onCustomerCreated }) => {
  const [fromEmail, setFromEmail] = useState('');
  const [subject, setSubject] = useState('Resume for consideration');
  const [body, setBody] = useState('Please find attached my resume for your consideration.');
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<{
    success: boolean;
    message: string;
    customer?: Customer;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const newAttachments: EmailAttachment[] = [];
    
    for (const file of acceptedFiles) {
      try {
        // Read file as base64
        const base64Content = await readFileAsBase64(file);
        
        newAttachments.push({
          filename: file.name,
          content: base64Content,
          contentType: file.type || 'application/octet-stream',
          size: file.size
        });
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error(`Error reading file: ${file.name}`);
      }
    }
    
    setAttachments([...attachments, ...newAttachments]);
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    }
  });
  
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  };
  
  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromEmail) {
      toast.error('Please enter a sender email address');
      return;
    }
    
    if (attachments.length === 0) {
      toast.error('Please attach at least one file');
      return;
    }
    
    setIsProcessing(true);
    setProcessingResult(null);
    
    try {
      // Simulate receiving an email with attachments
      const customer = await simulateIncomingEmail(
        fromEmail,
        'crm@example.com',
        subject,
        body,
        attachments
      );
      
      if (customer) {
        setProcessingResult({
          success: true,
          message: `Successfully created customer: ${customer.firstname} ${customer.lastname}`,
          customer
        });
        
        if (onCustomerCreated) {
          onCustomerCreated(customer);
        }
        
        toast.success('Customer created successfully from email attachment');
      } else {
        setProcessingResult({
          success: false,
          message: 'Failed to create customer from email attachment'
        });
        
        toast.error('Failed to create customer from email attachment');
      }
    } catch (error) {
      console.error('Error processing email:', error);
      setProcessingResult({
        success: false,
        message: `Error: ${(error as Error).message || 'Unknown error'}`
      });
      
      toast.error('Error processing email');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const resetForm = () => {
    setFromEmail('');
    setSubject('Resume for consideration');
    setBody('Please find attached my resume for your consideration.');
    setAttachments([]);
    setProcessingResult(null);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Simulate Incoming Email</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-700">
            From Email
          </label>
          <input
            type="email"
            id="fromEmail"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="sender@example.com"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        
        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700">
            Email Body
          </label>
          <textarea
            id="body"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments
          </label>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {isDragActive ? 'Drop the files here' : 'Drag and drop resume files, or click to select files'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: PDF, DOC, DOCX, and TXT
            </p>
          </div>
          
          {attachments.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Attached Files</h4>
              <ul className="space-y-2">
                {attachments.map((attachment, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-indigo-500 mr-2" />
                      <span className="text-sm">{attachment.filename}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({Math.round(attachment.size / 1024)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </button>
          
          <button
            type="submit"
            disabled={isProcessing || !fromEmail || attachments.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Simulate Incoming Email'}
          </button>
        </div>
      </form>
      
      {processingResult && (
        <div className={`mt-6 p-4 rounded-md ${processingResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {processingResult.success ? (
                <Check className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${processingResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {processingResult.success ? 'Success' : 'Error'}
              </h3>
              <div className={`mt-2 text-sm ${processingResult.success ? 'text-green-700' : 'text-red-700'}`}>
                <p>{processingResult.message}</p>
              </div>
              
              {processingResult.success && processingResult.customer && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Customer Details</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li><strong>Name:</strong> {processingResult.customer.firstname} {processingResult.customer.lastname}</li>
                    <li><strong>Email:</strong> {processingResult.customer.email}</li>
                    <li><strong>Phone:</strong> {processingResult.customer.phone || 'Not detected'}</li>
                    <li><strong>Status:</strong> {processingResult.customer.status}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailReceiver;