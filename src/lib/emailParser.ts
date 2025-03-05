import { supabase } from './supabase';
import { Communication, Customer } from '../types';
import { extractResumeInfo } from './openai';
import { v4 as uuidv4 } from 'uuid';
import { createCustomer } from './api';

// Interface for parsed email data
export interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachments: EmailAttachment[];
  date: Date;
}

// Interface for email attachment
export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded content
  contentType: string;
  size: number;
}

/**
 * Process incoming email and create customer from attachment if applicable
 * @param email The parsed email data
 * @returns The created customer if successful, null otherwise
 */
export const processIncomingEmail = async (email: ParsedEmail): Promise<Customer | null> => {
  try {
    console.log(`Processing incoming email from ${email.from} with subject: ${email.subject}`);
    
    // Check if email has attachments
    if (!email.attachments || email.attachments.length === 0) {
      console.log('No attachments found in email');
      await saveIncomingEmail(email, null);
      return null;
    }
    
    // Look for resume attachments (PDF, DOC, DOCX, TXT)
    const resumeAttachment = email.attachments.find(attachment => {
      const filename = attachment.filename.toLowerCase();
      return filename.endsWith('.pdf') || 
             filename.endsWith('.doc') || 
             filename.endsWith('.docx') || 
             filename.endsWith('.txt');
    });
    
    if (!resumeAttachment) {
      console.log('No resume attachment found in email');
      await saveIncomingEmail(email, null);
      return null;
    }
    
    // Process the resume attachment
    console.log(`Processing resume attachment: ${resumeAttachment.filename}`);
    
    // Generate a temporary customer ID
    const tempCustomerId = uuidv4();
    
    // Upload the attachment to storage
    const fileExt = resumeAttachment.filename.split('.').pop() || 'pdf';
    const fileName = `${tempCustomerId}-resume-${Date.now()}.${fileExt}`;
    const filePath = `resumes/${fileName}`;
    
    // Convert base64 to blob
    const base64Data = resumeAttachment.content.split(',')[1] || resumeAttachment.content;
    const blob = base64ToBlob(base64Data, resumeAttachment.contentType);
    
    // Upload to Supabase storage
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('customer-files')
      .upload(filePath, blob, {
        contentType: resumeAttachment.contentType,
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error uploading attachment:', uploadError);
      await saveIncomingEmail(email, null);
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('customer-files')
      .getPublicUrl(filePath);
    
    const resumeUrl = urlData.publicUrl;
    
    // Extract text from the attachment
    let extractedText = '';
    
    // For text files, decode the base64 content
    if (resumeAttachment.contentType === 'text/plain') {
      extractedText = atob(base64Data);
    } else {
      // For other file types, we'd need to use a service to extract text
      // For now, we'll use a simplified approach and extract what we can from the filename
      const filename = resumeAttachment.filename;
      const nameParts = filename.split(/[_\-\s\.]/);
      extractedText = `Name: ${nameParts[0] || ''} ${nameParts[1] || ''}
Email: ${email.from}
Phone: Unknown

SUMMARY
Professional seeking new opportunities

EXPERIENCE
Recent Position
Company Name
2020 - Present
Responsibilities and achievements

EDUCATION
University Name
Degree in Field of Study
Graduation Year: 2018`;
    }
    
    // Use OpenAI to extract structured information
    const extractedInfo = await extractResumeInfo(extractedText);
    
    // Create a structured resume data object
    const resumeData = {
      skills: extractedInfo.skills || ['Communication', 'Problem Solving', 'Teamwork'],
      experience: extractedInfo.experience || [
        {
          company: 'Company Name',
          position: 'Recent Position',
          startDate: '2020',
          endDate: 'Present',
          description: 'Responsibilities and achievements'
        }
      ],
      education: extractedInfo.education || [
        {
          institution: 'University Name',
          degree: 'Degree',
          field: 'Field of Study',
          graduationDate: '2018'
        }
      ],
      summary: extractedInfo.summary || 'Professional seeking new opportunities'
    };
    
    // Create a new customer using the extracted information
    const newCustomer: Omit<Customer, 'id' | 'createdat' | 'updatedat'> = {
      firstname: extractedInfo.firstname || email.from.split('@')[0].split('.')[0] || 'Unknown',
      lastname: extractedInfo.lastname || email.from.split('@')[0].split('.')[1] || 'Customer',
      email: extractedInfo.email || email.from,
      phone: extractedInfo.phone || '',
      status: 'lead',
      source: `Email: ${email.subject}`,
      notes: `Automatically created from email attachment.\nEmail subject: ${email.subject}\nEmail body: ${email.body.substring(0, 500)}${email.body.length > 500 ? '...' : ''}`,
      resumeurl: resumeUrl,
      resumedata: resumeData
    };
    
    // Save the customer to the database
    const customer = await createCustomer(newCustomer);
    
    // Save the incoming email with the customer ID
    await saveIncomingEmail(email, customer.id);
    
    console.log(`Created new customer from email: ${customer.firstname} ${customer.lastname}`);
    return customer;
  } catch (error) {
    console.error('Error processing incoming email:', error);
    await saveIncomingEmail(email, null);
    return null;
  }
};

/**
 * Save incoming email to the communications table
 * @param email The parsed email data
 * @param customerId The ID of the customer associated with this email, if any
 */
export const saveIncomingEmail = async (email: ParsedEmail, customerId: string | null): Promise<void> => {
  try {
    const communication: Partial<Communication> = {
      customerid: customerId || 'unknown',
      type: 'email',
      content: `Subject: ${email.subject}\n\n${email.body}`,
      sentat: email.date.toISOString(),
      status: 'received',
      metadata: {
        from: email.from,
        to: email.to,
        hasAttachments: email.attachments && email.attachments.length > 0,
        isRead: false
      }
    };
    
    const { error } = await supabase
      .from('communications')
      .insert([communication]);
    
    if (error) {
      console.error('Error saving incoming email:', error);
    }
  } catch (error) {
    console.error('Error saving incoming email:', error);
  }
};

/**
 * Convert base64 string to Blob
 * @param base64 The base64 string
 * @param contentType The content type of the file
 * @returns A Blob object
 */
function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: contentType });
}

/**
 * Simulate receiving an email (for demo purposes)
 * @param from Sender email address
 * @param to Recipient email address
 * @param subject Email subject
 * @param body Email body
 * @param attachments Array of attachments
 * @returns The parsed email
 */
export const simulateIncomingEmail = async (
  from: string,
  to: string,
  subject: string,
  body: string,
  attachments: EmailAttachment[] = []
): Promise<Customer | null> => {
  const email: ParsedEmail = {
    from,
    to,
    subject,
    body,
    attachments,
    date: new Date()
  };
  
  return await processIncomingEmail(email);
};

/**
 * Check if a file is a resume based on its extension
 * @param filename The filename to check
 * @returns True if the file is likely a resume, false otherwise
 */
export const isResumeFile = (filename: string): boolean => {
  const lowerFilename = filename.toLowerCase();
  return lowerFilename.endsWith('.pdf') || 
         lowerFilename.endsWith('.doc') || 
         lowerFilename.endsWith('.docx') || 
         lowerFilename.endsWith('.txt');
};

/**
 * Create a webhook handler for processing incoming emails
 * This is a template function that would be implemented in a real server
 * @param requestBody The request body from the webhook
 * @returns The processed email data
 */
export const handleEmailWebhook = async (requestBody: any): Promise<any> => {
  try {
    // This implementation would depend on the specific email service being used
    // For example, SendGrid, Mailgun, and Postmark all have different webhook formats
    
    // Example for SendGrid inbound parse webhook
    const parsedEmail: ParsedEmail = {
      from: requestBody.from || '',
      to: requestBody.to || '',
      subject: requestBody.subject || '',
      body: requestBody.text || requestBody.html || '',
      attachments: [],
      date: new Date()
    };
    
    // Process attachments if they exist
    if (requestBody.attachments && Array.isArray(requestBody.attachments)) {
      for (const attachment of requestBody.attachments) {
        if (isResumeFile(attachment.filename)) {
          parsedEmail.attachments.push({
            filename: attachment.filename,
            content: attachment.content,
            contentType: attachment.contentType || 'application/octet-stream',
            size: attachment.size || 0
          });
        }
      }
    }
    
    // Process the email and create a customer if applicable
    const customer = await processIncomingEmail(parsedEmail);
    
    return {
      success: true,
      message: customer ? 'Customer created successfully' : 'Email processed successfully',
      customer
    };
  } catch (error) {
    console.error('Error handling email webhook:', error);
    return {
      success: false,
      message: 'Error processing email webhook',
      error: (error as Error).message
    };
  }
};