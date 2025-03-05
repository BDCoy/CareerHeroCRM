import { supabase } from './supabase';
import { Customer, Communication } from '../types';
import { extractResumeInfo, ExtractedResumeInfo } from './openai';
import { EmailData, sendEmail as sendEmailService } from './emailService';
import { sendTwilioMessage } from './twilioService';

// Customer API
export const getCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('createdat', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getCustomer = async (id: string): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const createCustomer = async (customer: Omit<Customer, 'id' | 'createdat' | 'updatedat'>): Promise<Customer> => {
  const now = new Date().toISOString();
  
  // Ensure required fields have values
  const newCustomer = {
    ...customer,
    firstname: customer.firstname || 'Unknown',
    lastname: customer.lastname || 'Customer',
    email: customer.email || `unknown-${Date.now()}@example.com`,
    phone: customer.phone || '',
    status: customer.status || 'lead',
    createdat: now,
    updatedat: now
  };
  
  try {
    // First attempt to insert the customer
    const { data, error } = await supabase
      .from('customers')
      .insert([newCustomer])
      .select()
      .single();
    
    if (error) {
      // If there's an error with duplicate email, try with a modified email
      if (error.code === '23505' && error.message.includes('email')) {
        const modifiedCustomer = {
          ...newCustomer,
          email: `${newCustomer.email.split('@')[0]}-${Date.now()}@${newCustomer.email.split('@')[1]}`
        };
        
        const { data: retryData, error: retryError } = await supabase
          .from('customers')
          .insert([modifiedCustomer])
          .select()
          .single();
        
        if (retryError) throw retryError;
        return retryData;
      }
      
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

export const updateCustomer = async (id: string, customer: Partial<Customer>): Promise<Customer> => {
  const updates = {
    ...customer,
    updatedat: new Date().toISOString()
  };
  
  try {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Verify the update was successful by fetching the customer again
    const { data: verifiedData, error: verifiedError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (verifiedError) throw verifiedError;
    
    return verifiedData;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

export const deleteCustomer = async (id: string): Promise<void> => {
  try {
    // First, delete any communications associated with this customer
    // (This should happen automatically due to the CASCADE constraint, but we'll do it explicitly for safety)
    const { error: commError } = await supabase
      .from('communications')
      .delete()
      .eq('customerid', id);
    
    if (commError) {
      console.warn('Error deleting customer communications:', commError);
      // Continue with customer deletion even if communications deletion fails
    }
    
    // Then delete the customer
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Verify the customer was deleted
    const { data, error: verifyError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id);
    
    if (verifyError) throw verifyError;
    
    // If data still exists, the deletion failed
    if (data && data.length > 0) {
      throw new Error('Failed to delete customer');
    }
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

// Resume Upload and Parsing
export const uploadResume = async (file: File, customerId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${customerId}-resume-${Date.now()}.${fileExt}`;
  const filePath = `resumes/${fileName}`;
  
  try {
    const { error: uploadError } = await supabase.storage
      .from('customer-files')
      .upload(filePath, file, {
        upsert: true,
      });
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('customer-files')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading resume:', error);
    throw error;
  }
};

export const parseResume = async (
  fileUrl: string, 
  file?: File, 
  extractedText?: string
): Promise<{ resumeData: any, extractedInfo: ExtractedResumeInfo }> => {
  try {
    // Use the extracted text if provided, otherwise use the file to extract text
    let text = extractedText || '';
    
    // Clean up the text if it contains binary data or PDF markers
    if (text.includes('%PDF') || text.includes('stream') || text.includes('endobj')) {
      // Try to extract meaningful text by removing binary data
      text = text.replace(/%PDF[^]*?(?=\w{3,})/g, '')
                .replace(/stream[^]*?endstream/g, '')
                .replace(/obj[^]*?endobj/g, '')
                .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
    }
    
    if (!text && file) {
      // If we have the file object but no extracted text, use filename and type info
      const fileName = file.name;
      const nameParts = fileName.split(/[_\-\s\.]/);
      const possibleFirstName = nameParts[0] || '';
      const possibleLastName = nameParts[1] || '';
      
      text = `${possibleFirstName} ${possibleLastName}
Email: unknown@example.com
Phone: +1234567890

SUMMARY
Professional seeking new opportunities

SKILLS
Communication, Problem Solving, Teamwork

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
    
    console.log("Text for AI processing:", text.substring(0, 500) + "...");
    
    // Use OpenAI to extract structured information
    const extractedInfo = await extractResumeInfo(text);
    
    console.log("Extracted info from OpenAI:", extractedInfo);
    
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
    
    return { resumeData, extractedInfo };
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error('Failed to parse resume');
  }
};

// Communication APIs
export const sendEmail = async (to: string, subject: string, body: string, attachments: any, cc: string[] | undefined, bcc: string[] | undefined, customerId: string): Promise<{ communication: Communication, sendgridResponse?: any, smtpResponse?: any }> => {
  try {
    // Create email data
    const emailData: EmailData = {
      to,
      subject,
      body,
      attachments,
      cc,
      bcc,
    };
    
    // Send email using the email service
    return await sendEmailService(emailData, customerId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendSMS = async (to: string, body: string, customerId: string, type: 'sms' | 'whatsapp' = 'sms'): Promise<Communication> => {
  try {
    // Send the SMS using the Twilio service
    return await sendTwilioMessage(to, body, customerId, type);
  } catch (error) {
    console.error(`Error sending ${type}:`, error);
    throw new Error(`Failed to send ${type}: ${(error as Error).message}`);
  }
};

export const sendWhatsApp = async (to: string, body: string, customerId: string): Promise<Communication> => {
  // For now, use the SMS function with type 'whatsapp'
  return sendSMS(to, body, customerId, 'whatsapp');
};

export const getCommunications = async (customerId: string): Promise<Communication[]> => {
  try {
    const { data, error } = await supabase
      .from('communications')
      .select('*')
      .eq('customerid', customerId)
      .order('sentat', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching communications:', error);
    
    // Return empty array instead of throwing to prevent UI breakage
    return [];
  }
};