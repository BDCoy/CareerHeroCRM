import { supabase } from './supabase';
import { Communication } from '../types';

// Email template types
export type EmailTemplate = 'welcome' | 'follow-up' | 'proposal' | 'invoice' | 'custom';

// Email data interface
export interface EmailData {
  to: string;
  subject: string;
  body: string;
  template?: EmailTemplate;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: string; // Base64 encoded content
    contentType: string;
  }>;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

// Function to send an email
export const sendEmail = async (
  emailData: EmailData, 
  customerId: string
): Promise<{ communication: Communication, sendgridResponse?: any }> => {
  try {
    console.log(`Sending email to ${emailData.to} with subject: ${emailData.subject}`);

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        cc: emailData.cc,
        bcc: emailData.bcc,
        customerId
      }
    });

    if (error) {
      throw error;
    }

    if (!data.success) {
      throw new Error(data.message);
    }

    return {
      communication: data.communication,
      sendgridResponse: data.sendgridResponse
    };

  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Function to get email templates
export const getEmailTemplates = async (): Promise<Array<{
  id: string;
  name: string;
  subject: string;
  body: string;
  type: EmailTemplate;
}>> => {
  // In a real implementation, this would fetch templates from the database
  // For this demo, we'll return some mock templates
  return [
    {
      id: '1',
      name: 'Welcome Email',
      subject: 'Welcome to Our Service',
      body: `<p>Dear {{firstName}},</p>
<p>Welcome to our service! We're excited to have you on board.</p>
<p>Here are some resources to help you get started:</p>
<ul>
  <li><a href="#">Getting Started Guide</a></li>
  <li><a href="#">FAQ</a></li>
  <li><a href="#">Contact Support</a></li>
</ul>
<p>If you have any questions, feel free to reply to this email.</p>
<p>Best regards,<br>The Team</p>`,
      type: 'welcome'
    },
    {
      id: '2',
      name: 'Follow-up Email',
      subject: 'Following Up on Our Conversation',
      body: `<p>Dear {{firstName}},</p>
<p>I wanted to follow up on our conversation from {{date}}.</p>
<p>As discussed, here are the next steps:</p>
<ol>
  <li>{{nextStep1}}</li>
  <li>{{nextStep2}}</li>
  <li>{{nextStep3}}</li>
</ol>
<p>Please let me know if you have any questions or if there's anything else I can help with.</p>
<p>Best regards,<br>{{senderName}}</p>`,
      type: 'follow-up'
    },
    {
      id: '3',
      name: 'Proposal',
      subject: 'Proposal for {{projectName}}',
      body: `<p>Dear {{firstName}},</p>
<p>Thank you for the opportunity to submit a proposal for {{projectName}}.</p>
<p>Based on our discussion, I've attached a detailed proposal outlining our approach, timeline, and pricing.</p>
<p>Key highlights:</p>
<ul>
  <li>Project scope: {{projectScope}}</li>
  <li>Timeline: {{timeline}}</li>
  <li>Investment: {{price}}</li>
</ul>
<p>I'm available to discuss this proposal in more detail. Please feel free to schedule a call at your convenience.</p>
<p>Best regards,<br>{{senderName}}</p>`,
      type: 'proposal'
    },
    {
      id: '4',
      name: 'Invoice',
      subject: 'Invoice #{{invoiceNumber}} for {{projectName}}',
      body: `<p>Dear {{firstName}},</p>
<p>Please find attached invoice #{{invoiceNumber}} for {{projectName}}.</p>
<p>Invoice details:</p>
<ul>
  <li>Invoice number: {{invoiceNumber}}</li>
  <li>Date: {{invoiceDate}}</li>
  <li>Due date: {{dueDate}}</li>
  <li>Amount: {{amount}}</li>
</ul>
<p>Payment methods:</p>
<ul>
  <li>Bank transfer: {{bankDetails}}</li>
  <li>Credit card: A payment link has been included in the attached invoice</li>
</ul>
<p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
<p>Thank you for your business!</p>
<p>Best regards,<br>{{senderName}}</p>`,
      type: 'invoice'
    }
  ];
};

// Function to process template with data
export const processTemplate = (template: string, data: Record<string, any>): string => {
  let processedTemplate = template;
  
  // Replace all {{variable}} with the corresponding value from data
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedTemplate = processedTemplate.replace(regex, value);
  });
  
  return processedTemplate;
};

// Function to fetch received emails
export const fetchReceivedEmails = async (customerId?: string): Promise<Communication[]> => {
  try {
    // In a real implementation, this would fetch emails from an email service API
    // For this demo, we'll return some mock received emails
    
    // If customerId is provided, filter by customer
    let query = supabase
      .from('communications')
      .select('*')
      .eq('type', 'email')
      .order('sentat', { ascending: false });
    
    if (customerId) {
      query = query.eq('customerid', customerId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // For demo purposes, let's add some "received" emails that aren't in the database
    const mockReceivedEmails: Communication[] = customerId 
      ? [] // If filtering by customer, don't add mock received emails
      : [
        {
          id: 'mock-received-1',
          customerid: 'mock-customer-1',
          type: 'email',
          content: 'Subject: Question about your services\n\nHello,\n\nI saw your website and I\'m interested in learning more about your services. Could you please send me some information?\n\nThanks,\nJohn Smith',
          sentat: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          status: 'received',
          metadata: {
            from: 'john.smith@example.com',
            to: 'crm@example.com',
            isRead: true
          }
        },
        {
          id: 'mock-received-2',
          customerid: 'mock-customer-2',
          type: 'email',
          content: 'Subject: Pricing inquiry\n\nHi there,\n\nI\'m interested in your premium plan. Could you please send me a quote?\n\nBest,\nSarah Johnson',
          sentat: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          status: 'received',
          metadata: {
            from: 'sarah.johnson@example.com',
            to: 'crm@example.com',
            isRead: false
          }
        },
        {
          id: 'mock-received-3',
          customerid: 'mock-customer-3',
          type: 'email',
          content: 'Subject: Re: Your recent order\n\nThank you for the quick response. The order looks good.\n\nRegards,\nMichael Brown',
          sentat: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          status: 'received',
          metadata: {
            from: 'michael.brown@example.com',
            to: 'crm@example.com',
            isRead: false,
            isReply: true
          }
        }
      ];
    
    return [...(data || []), ...mockReceivedEmails];
  } catch (error) {
    console.error('Error fetching received emails:', error);
    throw new Error('Failed to fetch received emails');
  }
};

// Function to mark an email as read
export const markEmailAsRead = async (emailId: string): Promise<void> => {
  try {
    console.log(`Marking email ${emailId} as read`);
    
    // Get the current email data
    const { data, error } = await supabase
      .from('communications')
      .select('*')
      .eq('id', emailId)
      .eq('type', 'email')
      .single();
    
    if (error) {
      console.error('Error fetching email to mark as read:', error);
      return;
    }
    
    // Update the metadata to mark as read
    const updatedMetadata = {
      ...data.metadata,
      isRead: true
    };
    
    const { error: updateError } = await supabase
      .from('communications')
      .update({ metadata: updatedMetadata })
      .eq('id', emailId);
    
    if (updateError) {
      console.error('Error updating email read status:', updateError);
    }
  } catch (error) {
    console.error('Error marking email as read:', error);
    throw new Error('Failed to mark email as read');
  }
};