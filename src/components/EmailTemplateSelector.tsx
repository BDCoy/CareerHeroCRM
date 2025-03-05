import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { getEmailTemplates } from '../lib/emailService';
import { getSendGridTemplates } from '../lib/sendgrid';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
}

interface SendGridTemplate {
  id: string;
  name: string;
  versions: Array<{
    id: string;
    name: string;
    subject: string;
    html_content: string;
  }>;
}

interface EmailTemplateSelectorProps {
  onSelectTemplate: (template: EmailTemplate) => void;
}

const EmailTemplateSelector: React.FC<EmailTemplateSelectorProps> = ({ onSelectTemplate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sendGridTemplates, setSendGridTemplates] = useState<SendGridTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailService, setEmailService] = useState<'sendgrid' | 'local'>('local');
  
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      try {
        // Load local templates
        const localTemplates = await getEmailTemplates();
        setTemplates(localTemplates);
        
        // Check if SendGrid is configured
        try {
          const savedSettings = localStorage.getItem('crmSettings');
          if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            if (parsedSettings.emailApiKey && parsedSettings.emailService === 'sendgrid') {
              // Load SendGrid templates
              try {
                const sgTemplates = await getSendGridTemplates();
                setSendGridTemplates(sgTemplates);
                setEmailService('sendgrid');
              } catch (sgError) {
                console.error('Error loading SendGrid templates:', sgError);
              }
            }
          }
        } catch (error) {
          console.error('Error checking SendGrid configuration:', error);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTemplates();
  }, []);
  
  const handleSelectTemplate = (template: EmailTemplate) => {
    onSelectTemplate(template);
    setIsOpen(false);
  };
  
  const handleSelectSendGridTemplate = (template: SendGridTemplate) => {
    // Convert SendGrid template to our format
    if (template.versions && template.versions.length > 0) {
      const version = template.versions[0]; // Use the first version
      const convertedTemplate: EmailTemplate = {
        id: template.id,
        name: template.name,
        subject: version.subject || template.name,
        body: version.html_content || '',
        type: 'custom'
      };
      
      onSelectTemplate(convertedTemplate);
    } else {
      // If no versions, create a template with just the name
      const convertedTemplate: EmailTemplate = {
        id: template.id,
        name: template.name,
        subject: template.name,
        body: '',
        type: 'custom'
      };
      
      onSelectTemplate(convertedTemplate);
    }
    setIsOpen(false);
  };
  
  const toggleTemplateSource = () => {
    setEmailService(prev => prev === 'local' ? 'sendgrid' : 'local');
  };
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <FileText className="h-4 w-4 mr-2" />
        Templates
        {isOpen ? (
          <ChevronUp className="h-4 w-4 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-2" />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {sendGridTemplates.length > 0 && (
              <div className="px-3 py-2 border-b">
                <button
                  type="button"
                  onClick={toggleTemplateSource}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  {emailService === 'local' ? 'Show SendGrid Templates' : 'Show Local Templates'}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </button>
              </div>
            )}
            
            {isLoading ? (
              <div className="px-4 py-2 text-sm text-gray-500">Loading templates...</div>
            ) : emailService === 'local' ? (
              templates.length > 0 ? (
                templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <span className="truncate flex-1">{template.name}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500">No templates available</div>
              )
            ) : sendGridTemplates.length > 0 ? (
              <>
                <div className="px-3 py-1 bg-gray-50 text-xs text-gray-500">SendGrid Templates</div>
                {sendGridTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => handleSelectSendGridTemplate(template)}
                  >
                    <span className="truncate flex-1">{template.name}</span>
                  </button>
                ))}
              </>
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">No SendGrid templates available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateSelector;