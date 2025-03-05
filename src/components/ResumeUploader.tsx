import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { uploadResume, parseResume } from '../lib/api';
import { ExtractedResumeInfo } from '../lib/openai';
import { v4 as uuidv4 } from 'uuid';
import ResumeDataDisplay from './ResumeDataDisplay';
import { extractTextFromFile, fallbackExtractTextFromPDF } from '../lib/pdfParser';

interface ResumeUploaderProps {
  onUploadComplete: (resumeUrl: string, resumeData: any, extractedInfo: ExtractedResumeInfo) => void;
  isNewCustomer?: boolean;
  customerId?: string;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ 
  onUploadComplete, 
  isNewCustomer = false,
  customerId = 'temp-id' 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedResumeInfo | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setExtractedInfo(null);
    setRawText(null);
    
    try {
      // Generate a unique ID for the file to avoid collisions
      const uniqueId = customerId === 'temp-id' ? uuidv4() : customerId;
      
      // Extract text from the file
      setIsExtracting(true);
      let extractedText = '';
      
      try {
        // First try direct text extraction for non-PDF files
        if (file.type !== 'application/pdf') {
          extractedText = await file.text();
        } else {
          // For PDFs, use the PDF.js extractor
          try {
            extractedText = await extractTextFromFile(file);
          } catch (pdfError) {
            console.error('PDF.js extraction failed:', pdfError);
            // If PDF.js fails, try the fallback method
            extractedText = await fallbackExtractTextFromPDF(file);
          }
        }
        
        // If the extracted text is too short or contains mostly binary data,
        // try the fallback method for PDFs
        if (file.type === 'application/pdf' && 
            (extractedText.length < 100 || 
             extractedText.includes('%PDF') || 
             extractedText.includes('stream'))) {
          console.log("Primary extraction produced poor results, trying fallback method");
          const fallbackText = await fallbackExtractTextFromPDF(file);
          
          // If fallback text is better, use it
          if (fallbackText.length > extractedText.length && 
              !fallbackText.includes('%PDF') && 
              !fallbackText.includes('stream')) {
            extractedText = fallbackText;
          }
        }
        
        setRawText(extractedText);
      } catch (extractError) {
        console.error('Error extracting text:', extractError);
        
        // Try fallback method for PDFs
        if (file.type === 'application/pdf') {
          try {
            extractedText = await fallbackExtractTextFromPDF(file);
            setRawText(extractedText);
          } catch (fallbackError) {
            console.error('Fallback extraction failed:', fallbackError);
            setRawText(`Could not extract text from ${file.name}. Using filename for basic information.`);
          }
        } else {
          setRawText(`Error extracting text from ${file.name}. Using filename for basic information.`);
        }
      }
      
      setIsExtracting(false);
      
      // Upload the resume
      const resumeUrl = await uploadResume(file, uniqueId);
      
      // Parse the resume
      setIsParsing(true);
      setIsUploading(false);
      
      const { resumeData, extractedInfo } = await parseResume(resumeUrl, file, extractedText);
      
      console.log("Extracted info from resume:", extractedInfo);
      
      setExtractedInfo(extractedInfo);
      setIsParsing(false);
      setSuccess(true);
      
      // Call the callback with the resume URL, parsed data, and extracted info
      onUploadComplete(resumeUrl, resumeData, extractedInfo);
    } catch (err) {
      setIsUploading(false);
      setIsParsing(false);
      setIsExtracting(false);
      setError((err as Error).message);
    }
  }, [customerId, onUploadComplete]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: isUploading || isParsing || isExtracting
  });
  
  return (
    <div className={isNewCustomer ? "mb-6" : "mt-6"}>
      {isNewCustomer && (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Upload Resume</h3>
          <p className="text-sm text-gray-500">
            Upload a resume to automatically extract customer information.
          </p>
        </div>
      )}
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
        } ${isUploading || isParsing || isExtracting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-indigo-500 animate-pulse" />
            <p className="mt-2 text-sm text-gray-600">Uploading resume...</p>
          </div>
        ) : isExtracting ? (
          <div className="flex flex-col items-center">
            <FileText className="h-10 w-10 text-indigo-500 animate-pulse" />
            <p className="mt-2 text-sm text-gray-600">Extracting text from document...</p>
          </div>
        ) : isParsing ? (
          <div className="flex flex-col items-center">
            <FileText className="h-10 w-10 text-indigo-500 animate-pulse" />
            <p className="mt-2 text-sm text-gray-600">Parsing resume...</p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center">
            <Check className="h-10 w-10 text-green-500" />
            <p className="mt-2 text-sm text-gray-600">Resume uploaded and parsed successfully!</p>
            <p className="mt-1 text-xs text-gray-500">Drop a new file to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive ? 'Drop the resume here' : 'Drag and drop a resume, or click to select a file'}
            </p>
            <p className="mt-1 text-xs text-gray-500">Supports PDF, DOC, DOCX, and TXT</p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 flex items-center text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {/* Display extracted data */}
      <ResumeDataDisplay extractedInfo={extractedInfo} rawText={rawText} />
    </div>
  );
};

export default ResumeUploader;