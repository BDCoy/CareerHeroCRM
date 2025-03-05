import React from 'react';
import { ExtractedResumeInfo } from '../lib/openai';

interface ResumeDataDisplayProps {
  extractedInfo: ExtractedResumeInfo | null;
  rawText: string | null;
}

const ResumeDataDisplay: React.FC<ResumeDataDisplayProps> = ({ extractedInfo, rawText }) => {
  if (!extractedInfo && !rawText) {
    return null;
  }

  // Clean up raw text for display
  const cleanedText = rawText ? 
    rawText
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable characters
      .replace(/%PDF[^]*?(?=\w{3,})/g, '') // Remove PDF header
      .replace(/stream[^]*?endstream/g, '') // Remove stream objects
      .replace(/obj[^]*?endobj/g, '')      // Remove PDF objects
      .replace(/\s+/g, ' ')                // Normalize whitespace
      .trim() : null;

  return (
    <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Extracted Resume Data</h3>
      
      {extractedInfo && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-800 mb-2">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-gray-600">First Name:</p>
              <p className="font-medium">{extractedInfo.firstname || 'Not detected'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Name:</p>
              <p className="font-medium">{extractedInfo.lastname || 'Not detected'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email:</p>
              <p className="font-medium break-all">{extractedInfo.email || 'Not detected'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone:</p>
              <p className="font-medium">{extractedInfo.phone || 'Not detected'}</p>
            </div>
          </div>
        </div>
      )}
      
      {cleanedText && (
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-2">Resume Text Content</h4>
          <div className="bg-white p-3 rounded border border-gray-200 max-h-60 overflow-y-auto">
            <pre className="text-xs whitespace-pre-wrap">{cleanedText}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeDataDisplay;