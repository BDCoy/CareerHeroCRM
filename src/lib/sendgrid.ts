import { EmailData } from './emailService';
import { Communication } from '../types';
import { supabase } from './supabase';

// SendGrid API key from environment or localStorage
const getSendGridApiKey = (): string => {
  // First try to get from environment variables
  const envApiKey = import.meta.env.VITE_SENDGRID_API_KEY;
  if (envApiKey) {
    return envApiKey;
  }
  
  // Fall back to localStorage
  try {
    const savedSettings = localStorage.getItem('crmSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      return parsedSettings.emailApiKey || '';
    }
  } catch (error) {
    console.error('Error getting SendGrid API key from localStorage:', error);
  }
  return '';
};

// Get sender email from settings
const getSenderEmail = (): { email: string; name: string } => {
  try {
    const savedSettings = localStorage.getItem('crmSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      return { 
        email: parsedSettings.emailFromAddress || 'crm@example.com',
        name: parsedSettings.companyName || 'CRM System'
      };
    }
  } catch (error) {
    console.error('Error getting sender email from localStorage:', error);
  }
  return { email: 'crm@example.com', name: 'CRM System' };
};

/**
 * Send an email using SendGrid API
 * @param emailData The email data to send
 * @param customerId The ID of the customer to associate with this email
 * @returns A promise that resolves to the communication record and SendGrid response
 */
export const sendEmailWithSendGrid = async (
  emailData: EmailData, 
  customerId: string
): Promise<{ communication: Communication, sendgridResponse?: any }> => {
  const apiKey = getSendGridApiKey();
  const sender = getSenderEmail();
  
  if (!apiKey) {
    console.warn('SendGrid API key not configured. Using mock email service.');
    // Record the email in the database but don't actually send it
    const communication = {
      customerid: customerId,
      type: 'email' as const,
      content: `Subject: ${emailData.subject}\n\n${emailData.body}`,
      sentat: new Date().toISOString(),
      status: 'sent' as const,
      metadata: {
        to: emailData.to,
        from: sender.email,
        cc: emailData.cc,
        bcc: emailData.bcc,
        replyTo: emailData.replyTo,
        template: emailData.template,
        hasAttachments: !!emailData.attachments?.length,
        sendgridConfigured: false
      }
    };
    
    const { data, error } = await supabase
      .from('communications')
      .insert([communication])
      .select()
      .single();
    
    if (error) throw error;
    return { communication: data };
  }
  
  try {
    console.log(`Sending email to ${emailData.to} with subject: ${emailData.subject}`);
    
    // Prepare the SendGrid API request payload
    const payload = {
      personalizations: [
        {
          to: [{ email: emailData.to }],
          subject: emailData.subject,
          ...(emailData.cc && { cc: emailData.cc.map(email => ({ email })) }),
          ...(emailData.bcc && { bcc: emailData.bcc.map(email => ({ email })) }),
        },
      ],
      from: { email: sender.email, name: sender.name },
      ...(emailData.replyTo && { reply_to: { email: emailData.replyTo } }),
      content: [
        {
          type: 'text/html',
          value: emailData.body.replace(/\n/g, '<br>'),
        },
      ],
      ...(emailData.attachments && {
        attachments: emailData.attachments.map(attachment => ({
          content: attachment.content.split(',')[1] || attachment.content,
          filename: attachment.filename,
          type: attachment.contentType,
          disposition: 'attachment',
        })),
      }),
    };
    
    let sendgridResponse = null;
    
    // Make the actual API call to SendGrid
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        let errorMessage = `SendGrid API error: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = `SendGrid API error: ${errorData.message || response.statusText}`;
        } catch (e) {
          // If we can't parse the error response, just use the status text
        }
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Capture the response for debugging
      sendgridResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      };
      
      console.log('Email sent successfully via SendGrid API');
    } catch (apiError) {
      console.error('Error calling SendGrid API:', apiError);
      // We'll still record the email in the database, but mark it as failed
      const communication = {
        customerid: customerId,
        type: 'email' as const,
        content: `Subject: ${emailData.subject}\n\n${emailData.body}`,
        sentat: new Date().toISOString(),
        status: 'failed' as const,
        metadata: {
          to: emailData.to,
          from: sender.email,
          cc: emailData.cc,
          bcc: emailData.bcc,
          replyTo: emailData.replyTo,
          template: emailData.template,
          hasAttachments: !!emailData.attachments?.length,
          sendgridConfigured: true,
          sendgridApiKey: `${apiKey.substring(0, 5)}...`,
          error: (apiError as Error).message,
          method: 'api'
        }
      };
      
      const { data, error } = await supabase
        .from('communications')
        .insert([communication])
        .select()
        .single();
      
      if (error) throw error;
      return { communication: data };
    }
    
    // Record the email in the database
    const communication = {
      customerid: customerId,
      type: 'email' as const,
      content: `Subject: ${emailData.subject}\n\n${emailData.body}`,
      sentat: new Date().toISOString(),
      status: 'sent' as const,
      metadata: {
        to: emailData.to,
        from: sender.email,
        cc: emailData.cc,
        bcc: emailData.bcc,
        replyTo: emailData.replyTo,
        template: emailData.template,
        hasAttachments: !!emailData.attachments?.length,
        sendgridConfigured: true,
        sendgridApiKey: `${apiKey.substring(0, 5)}...`,
        method: 'api'
      }
    };
    
    const { data, error } = await supabase
      .from('communications')
      .insert([communication])
      .select()
      .single();
    
    if (error) throw error;
    return { 
      communication: data,
      sendgridResponse
    };
  } catch (error) {
    console.error('Error sending email with SendGrid:', error);
    throw new Error('Failed to send email with SendGrid');
  }
};

/**
 * Verify SendGrid API key is valid
 * @param apiKey The SendGrid API key to verify
 * @returns A promise that resolves to a boolean indicating if the key is valid
 */
export const verifySendGridApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    // Make an actual API call to SendGrid to verify the key
    const response = await fetch('https://api.sendgrid.com/v3/scopes', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error verifying SendGrid API key:', error);
    return false;
  }
};

/**
 * Test the SendGrid connection
 * @returns A promise that resolves to an object with the test results
 */
export const testSendGridConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  const apiKey = getSendGridApiKey();
  
  if (!apiKey) {
    return {
      success: false,
      message: 'SendGrid API key not configured'
    };
  }
  
  try {
    // Test the API key by making a request to the scopes endpoint
    const response = await fetch('https://api.sendgrid.com/v3/scopes', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    if (!response.ok) {
      let errorMessage = `SendGrid API error: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = `SendGrid API error: ${errorData.message || response.statusText}`;
      } catch (e) {
        // If we can't parse the error response, just use the status text
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
    
    // Get the scopes data
    const scopes = await response.json();
    
    // Check if the API key has the necessary permissions
    const hasMailSend = scopes.scopes && scopes.scopes.includes('mail.send');
    
    if (!hasMailSend) {
      return {
        success: false,
        message: 'SendGrid API key does not have mail.send permission',
        details: scopes
      };
    }
    
    return {
      success: true,
      message: 'SendGrid connection successful',
      details: {
        scopes: scopes.scopes,
        hasMailSend
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Error testing SendGrid connection: ${(error as Error).message}`
    };
  }
};

/**
 * Get email templates from SendGrid
 * @returns A promise that resolves to an array of SendGrid templates
 */
export const getSendGridTemplates = async (): Promise<any[]> => {
  const apiKey = getSendGridApiKey();
  
  if (!apiKey) {
    console.warn('SendGrid API key not configured. Cannot fetch templates.');
    return [];
  }
  
  try {
    // Fetch templates from SendGrid API
    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      let errorMessage = `SendGrid API error: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = `SendGrid API error: ${errorData.message || response.statusText}`;
      } catch (e) {
        // If we can't parse the error response, just use the status text
      }
      console.error(errorMessage);
      return [];
    }
    
    const data = await response.json();
    
    // For each template, fetch its versions to get the content
    const templatesWithVersions = [];
    
    for (const template of data.templates || []) {
      try {
        // Fetch template versions
        const versionsResponse = await fetch(`https://api.sendgrid.com/v3/templates/${template.id}/versions`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (versionsResponse.ok) {
          const versionsData = await versionsResponse.json();
          templatesWithVersions.push({
            ...template,
            versions: versionsData.versions || []
          });
        } else {
          // If we can't fetch versions, still include the template but with empty versions
          templatesWithVersions.push({
            ...template,
            versions: []
          });
        }
      } catch (error) {
        console.error(`Error fetching versions for template ${template.id}:`, error);
        // Still include the template but with empty versions
        templatesWithVersions.push({
          ...template,
          versions: []
        });
      }
    }
    
    return templatesWithVersions;
  } catch (error) {
    console.error('Error fetching SendGrid templates:', error);
    return [];
  }
};