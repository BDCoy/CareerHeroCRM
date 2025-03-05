import React from 'react';

interface GeneralSettingsProps {
  formData: {
    companyName: string;
    emailSignature: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ formData, handleChange }) => {
  return (
    <div className="space-y-6">
      <h4 className="text-md font-medium text-gray-900 mb-4">General Settings</h4>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            type="text"
            name="companyName"
            id="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div className="sm:col-span-2">
          <label htmlFor="emailSignature" className="block text-sm font-medium text-gray-700">
            Email Signature
          </label>
          <textarea
            name="emailSignature"
            id="emailSignature"
            rows={4}
            value={formData.emailSignature}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;