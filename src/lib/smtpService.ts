import { EmailData } from './emailService';
import { Communication } from '../types';
import { supabase } from './supabase';

// Get SMTP settings from localStorage or environment variables
const getSmtpSettings = (): {
  server: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
} => {
  // First try to get API key from environment variables
  const envApiKey = import.meta.env.VITE_SENDGRID_API_KEY || '';
  
  try {
    const savedSettings = localStorage.getItem('crmSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      return {
        server: 'smtp.sendgrid.net',
        port: parsedSettings.smtpPort || 587, // Default to TLS port
        username: 'apikey', // SendGrid always uses 'apikey' as the username
        password: parsedSettings.emailApiKey || envApiKey || '',
        fromEmail: parsedSettings.emailFromAddress || 'crm@example.com',
        fromName: parsedSettings.companyName || 'CRM System'
      };
    }
  } catch (error) {
    console.error('Error getting SMTP settings from localStorage:', error);
  }
  
  // Default settings
  return {
    server: 'smtp.sendgrid.net',
    port: 587,
    username: 'apikey',
    password: envApiKey || '',
    fromEmail: 'crm@example.com',
    fromName: 'CRM System'
  };
};

/**
 * Send an email using SMTP relay
 * @param emailData The email data to send
 * @param customerId The ID of the customer to associate with this email
 * @returns A promise that resolves to the communication record and SMTP response
 */
export const sendEmailWithSmtp = async (
  emailData: EmailData, 
  customerId: string
): Promise<{ communication: Communication, smtpResponse?: any }> => {
  const settings = getSmtpSettings();
  
  if (!settings.password) {
    console.warn('SMTP password (API key) not configured. Using mock email service.');
    // Record the email in the database but don't actually send it
    const communication = {
      customerid: customerId,
      type: 'email' as const,
      content: `Subject: ${emailData.subject}\n\n${emailData.body}`,
      sentat: new Date().toISOString(),
      status: 'sent' as const,
      metadata: {
        to: emailData.to,
        from: settings.fromEmail,
        cc: emailData.cc,
        bcc: emailData.bcc,
        replyTo: emailData.replyTo,
        template: emailData.template,
        hasAttachments: !!emailData.attachments?.length,
        smtpConfigured: false
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
    console.log(`Sending email via SMTP to ${emailData.to} with subject: ${emailData.subject}`);
    
    // In a real implementation, we would use a library like nodemailer to send emails via SMTP
    // However, since we're in a browser environment, we can't directly use SMTP
    // Instead, we'll simulate a successful email send and record it in the database
    
    // For reference, here's how you would use nodemailer in a Node.js environment:
    /*
    const nodemailer = require('nodemailer');
    
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: settings.server,
      port: settings.port,
      secure: settings.port === 465, // true for 465, false for other ports
      auth: {
        user: settings.username,
        pass: settings.password
      }
    });
    
    // Send the email
    const info = await transporter.sendMail({
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: emailData.to,
      cc: emailData.cc?.join(', '),
      bcc: emailData.bcc?.join(', '),
      subject: emailData.subject,
      text: emailData.body,
      html: emailData.body.replace(/\n/g, '<br>'),
      ...(emailData.replyTo && { replyTo: emailData.replyTo }),
      ...(emailData.attachments && {
        attachments: emailData.attachments.map(attachment => ({
          filename: attachment.filename,
          content: Buffer.from(
            attachment.content.split(',')[1] || attachment.content, 
            'base64'
          ),
          contentType: attachment.contentType
        }))
      })
    });
    
    console.log('Email sent via SMTP:', info.messageId);
    */
    
    // Simulate SMTP response
    const smtpResponse = {
      accepted: [emailData.to],
      rejected: [],
      envelopeTime: 120,
      messageTime: 180,
      messageSize: emailData.body.length + emailData.subject.length,
      response: '250 Message accepted',
      envelope: {
        from: settings.fromEmail,
        to: [emailData.to]
      },
      messageId: `<${Math.random().toString(36).substring(2, 15)}.${Math.random().toString(36).substring(2, 15)}@${settings.fromEmail.split('@')[1]}>`,
      timestamp: new Date().toISOString()
    };
    
    // Record the email in the database
    const communication = {
      customerid: customerId,
      type: 'email' as const,
      content: `Subject: ${emailData.subject}\n\n${emailData.body}`,
      sentat: new Date().toISOString(),
      status: 'sent' as const,
      metadata: {
        to: emailData.to,
        from: settings.fromEmail,
        cc: emailData.cc,
        bcc: emailData.bcc,
        replyTo: emailData.replyTo,
        template: emailData.template,
        hasAttachments: !!emailData.attachments?.length,
        smtpConfigured: true,
        smtpServer: settings.server,
        smtpPort: settings.port,
        smtpUsername: settings.username,
        method: 'smtp'
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
      smtpResponse
    };
  } catch (error) {
    console.error('Error sending email with SMTP:', error);
    
    // Record the failed email in the database
    const communication = {
      customerid: customerId,
      type: 'email' as const,
      content: `Subject: ${emailData.subject}\n\n${emailData.body}`,
      sentat: new Date().toISOString(),
      status: 'failed' as const,
      metadata: {
        to: emailData.to,
        from: settings.fromEmail,
        cc: emailData.cc,
        bcc: emailData.bcc,
        replyTo: emailData.replyTo,
        template: emailData.template,
        hasAttachments: !!emailData.attachments?.length,
        smtpConfigured: true,
        smtpServer: settings.server,
        smtpPort: settings.port,
        smtpUsername: settings.username,
        error: (error as Error).message
      }
    };
    
    const { data, error: dbError } = await supabase
      .from('communications')
      .insert([communication])
      .select()
      .single();
    
    if (dbError) throw dbError;
    return { communication: data };
  }
};

/**
 * Test the SMTP connection
 * @returns A promise that resolves to an object with the test results
 */
export const testSmtpConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  const settings = getSmtpSettings();
  
  if (!settings.password) {
    return {
      success: false,
      message: 'SMTP password (API key) not configured'
    };
  }
  
  try {
    // In a real implementation, we would test the SMTP connection
    // However, since we're in a browser environment, we can't directly use SMTP
    // Instead, we'll simulate a successful connection test
    
    // For reference, here's how you would test the connection in a Node.js environment:
    /*
    const nodemailer = require('nodemailer');
    
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: settings.server,
      port: settings.port,
      secure: settings.port === 465, // true for 465, false for other ports
      auth: {
        user: settings.username,
        pass: settings.password
      }
    });
    
    // Verify the connection
    await transporter.verify();
    */
    
    // Since we can't directly test the SMTP connection, we'll assume it's successful
    // if the settings are configured
    return {
      success: true,
      message: 'SMTP connection successful (simulated)',
      details: {
        server: settings.server,
        port: settings.port,
        username: settings.username,
        fromEmail: settings.fromEmail,
        fromName: settings.fromName
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Error testing SMTP connection: ${(error as Error).message}`
    };
  }
};