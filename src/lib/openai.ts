import OpenAI from 'openai';

// Initialize OpenAI client with the provided API key from environment variables
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // For client-side usage (in production, use server-side API calls)
});

export interface ExtractedResumeInfo {
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
  }>;
  summary?: string;
}

// Function to normalize phone numbers to international format
function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters except the plus sign
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it already has a plus sign, assume it's correctly formatted with country code
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Handle common country codes
  // Portugal: Convert numbers starting with 00351 or 351 to +351
  if (cleaned.startsWith('00351')) {
    return '+' + cleaned.substring(2); // Remove the '00' prefix
  }
  
  if (cleaned.startsWith('351')) {
    return '+' + cleaned;
  }
  
  // Portugal mobile numbers often start with 9 and are 9 digits long
  if (cleaned.length === 9 && (cleaned.startsWith('9') || cleaned.startsWith('2') || cleaned.startsWith('3'))) {
    return '+351' + cleaned;
  }
  
  // UK: Convert numbers starting with 0 to +44
  if (cleaned.startsWith('0') && (cleaned.length === 10 || cleaned.length === 11)) {
    // UK mobile numbers start with 07
    if (cleaned.startsWith('07')) {
      return '+44' + cleaned.substring(1);
    }
    return '+44' + cleaned.substring(1);
  }
  
  // US/Canada: Add +1 to 10-digit numbers
  if (cleaned.length === 10 && (cleaned.startsWith('2') || cleaned.startsWith('3') || 
                               cleaned.startsWith('4') || cleaned.startsWith('5') || 
                               cleaned.startsWith('6') || cleaned.startsWith('7') || 
                               cleaned.startsWith('8') || cleaned.startsWith('9'))) {
    return '+1' + cleaned;
  }
  
  // If we can't determine the country code, return as is
  // This is better than guessing incorrectly
  return cleaned;
}

// Function to format phone numbers for better readability
function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // If it doesn't start with +, return as is
  if (!phone.startsWith('+')) {
    return phone;
  }
  
  // Remove any non-digit characters except the plus sign
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Format based on country code
  if (phone.startsWith('+351')) { // Portugal
    // Format as +351 XXX XXX XXX
    const countryCode = '+351';
    const significant = cleaned.substring(4);
    if (significant.length === 9) {
      return `${countryCode} ${significant.substring(0, 3)} ${significant.substring(3, 6)} ${significant.substring(6)}`;
    }
  } else if (phone.startsWith('+44')) { // UK
    // Format as +44 XXXX XXXXXX
    const countryCode = '+44';
    const significant = cleaned.substring(3);
    if (significant.length === 10) {
      return `${countryCode} ${significant.substring(0, 4)} ${significant.substring(4)}`;
    }
  } else if (phone.startsWith('+1')) { // US/Canada
    // Format as +1 (XXX) XXX-XXXX
    const countryCode = '+1';
    const significant = cleaned.substring(2);
    if (significant.length === 10) {
      return `${countryCode} (${significant.substring(0, 3)}) ${significant.substring(3, 6)}-${significant.substring(6)}`;
    }
  }
  
  // If no specific formatting rule, return as is with the plus sign
  return phone;
}

export async function extractResumeInfo(text: string): Promise<ExtractedResumeInfo> {
  try {
    if (!text || text.trim() === '') {
      console.warn('Empty text provided for resume extraction');
      return {};
    }

    // Enhanced regex patterns for better extraction
    // Email regex - comprehensive pattern for email addresses with various TLDs
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    
    // Alternative email patterns to catch more variations
    const altEmailRegex1 = /[A-Za-z0-9._%+-]+[@＠][A-Za-z0-9.-]+\.[A-Za-z]{2,}/g; // Unicode @ symbol
    const altEmailRegex2 = /[A-Za-z0-9._%+-]+\s*[\[\(]at[\]\)]\s*[A-Za-z0-9.-]+\s*[\[\(]dot[\]\)]\s*[A-Za-z]{2,}/gi; // "at" and "dot" notation
    const altEmailRegex3 = /[A-Za-z0-9._%+-]+\s*\(at\)\s*[A-Za-z0-9.-]+\s*\(dot\)\s*[A-Za-z]{2,}/gi; // (at) and (dot) notation
    
    // Phone regex patterns - multiple patterns to catch different formats
    // International format with country code: +XXX or 00XXX
    const intlPhoneRegex = /(?:\+|00)[0-9]{1,4}[\s\-\.]?(?:\(?\d{1,}\)?[\s\-\.]?){1,5}/g;
    
    // Portugal format: +351 XXX XXX XXX or 00351 XXX XXX XXX or 9XX XXX XXX
    const ptPhoneRegex = /(?:\+351|00351)?[\s\-\.]?(?:9|2|3)(?:\d[\s\-\.]?){8}/g;
    
    // UK format: +44 XXXX XXXXXX or 0XXXX XXXXXX
    const ukPhoneRegex = /(?:\+44|0044|0)(?:\s|\-)?(?:\d{2,5}|\(\d{2,5}\))(?:\s|\-)?(?:\d{3,4})(?:\s|\-)?(?:\d{3,4})/g;
    
    // US/Canada format: +1 (XXX) XXX-XXXX or XXX-XXX-XXXX
    const usPhoneRegex = /(?:\+1|1)?[\s\-\.]?\(?(?:\d{3})\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}/g;
    
    // Generic format: sequence of digits with optional separators
    const genericPhoneRegex = /(?:\d[\s\-\.]?){10,15}/g;
    
    // Extract email using multiple regex patterns
    let emailMatches = text.match(emailRegex) || [];
    
    if (emailMatches.length === 0) {
      emailMatches = text.match(altEmailRegex1) || [];
    }
    
    if (emailMatches.length === 0) {
      // Try to find obfuscated emails and convert them
      const obfuscatedMatches = text.match(altEmailRegex2) || text.match(altEmailRegex3) || [];
      if (obfuscatedMatches.length > 0) {
        // Convert obfuscated email to standard format
        emailMatches = obfuscatedMatches.map(email => {
          return email
            .replace(/\s*[\[\(]at[\]\)]\s*/gi, '@')
            .replace(/\s*\(at\)\s*/gi, '@')
            .replace(/\s*[\[\(]dot[\]\)]\s*/gi, '.')
            .replace(/\s*\(dot\)\s*/gi, '.');
        });
      }
    }
    
    // Look for common email patterns in the text
    if (emailMatches.length === 0) {
      const emailLines = text.split('\n').filter(line => 
        line.toLowerCase().includes('email') || 
        line.toLowerCase().includes('e-mail') || 
        line.toLowerCase().includes('mail') ||
        line.toLowerCase().includes('contact')
      );
      
      for (const line of emailLines) {
        const matches = line.match(emailRegex);
        if (matches && matches.length > 0) {
          emailMatches = matches;
          break;
        }
      }
    }
    
    const extractedEmail = emailMatches.length > 0 ? emailMatches[0] : '';
    console.log("Extracted email via regex:", extractedEmail);
    
    // Try to extract phone using multiple regex patterns in order of specificity
    let extractedPhone = '';
    
    // First try international format with country code
    let phoneMatches = text.match(intlPhoneRegex);
    
    // Then try country-specific formats
    if (!phoneMatches || phoneMatches.length === 0) {
      phoneMatches = text.match(ptPhoneRegex); // Portugal
    }
    
    if (!phoneMatches || phoneMatches.length === 0) {
      phoneMatches = text.match(ukPhoneRegex); // UK
    }
    
    if (!phoneMatches || phoneMatches.length === 0) {
      phoneMatches = text.match(usPhoneRegex); // US/Canada
    }
    
    // Finally try generic format
    if (!phoneMatches || phoneMatches.length === 0) {
      phoneMatches = text.match(genericPhoneRegex);
    }
    
    if (phoneMatches && phoneMatches.length > 0) {
      extractedPhone = phoneMatches[0].trim();
      // Normalize the phone number to international format
      extractedPhone = normalizePhoneNumber(extractedPhone);
      // Format the phone number for better readability
      extractedPhone = formatPhoneNumber(extractedPhone);
    }

    console.log("Extracted phone via regex:", extractedPhone);

    // Look for phone numbers in lines containing "mobile", "phone", "tel", etc.
    if (!extractedPhone) {
      const phoneLines = text.split('\n').filter(line => 
        line.toLowerCase().includes('mobile') || 
        line.toLowerCase().includes('phone') || 
        line.toLowerCase().includes('tel') ||
        line.toLowerCase().includes('contact')
      );
      
      for (const line of phoneLines) {
        // Try all phone regex patterns on each line
        const matches = line.match(intlPhoneRegex) || 
                        line.match(ptPhoneRegex) || 
                        line.match(ukPhoneRegex) || 
                        line.match(usPhoneRegex) || 
                        line.match(genericPhoneRegex);
        
        if (matches && matches.length > 0) {
          extractedPhone = matches[0].trim();
          extractedPhone = normalizePhoneNumber(extractedPhone);
          extractedPhone = formatPhoneNumber(extractedPhone);
          break;
        }
        
        // If no matches with regex, try to extract digits directly
        const digits = line.replace(/[^\d+]/g, '');
        if (digits.length >= 9) {
          extractedPhone = normalizePhoneNumber(digits);
          extractedPhone = formatPhoneNumber(extractedPhone);
          break;
        }
      }
    }

    // Fallback to manual extraction for specific formats
    if (!extractedPhone) {
      // Try to find Portuguese mobile numbers (9 digits starting with 9)
      const ptMobileMatch = text.match(/\b9\d{8}\b/);
      if (ptMobileMatch) {
        extractedPhone = '+351 ' + ptMobileMatch[0];
      }
    }

    // Try to extract name from the text
    let firstname = '';
    let lastname = '';

    // Look for lines that might contain a name (usually at the beginning of the resume)
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length > 0) {
      // The first non-empty line often contains the name
      const possibleNameLine = lines[0];
      
      // Split by spaces and take first two parts as name
      const nameParts = possibleNameLine.split(/\s+/);
      if (nameParts.length >= 2) {
        firstname = nameParts[0];
        lastname = nameParts[nameParts.length - 1];
      } else if (nameParts.length === 1) {
        firstname = nameParts[0];
      }
    }

    // Use OpenAI to extract structured information
    try {
      // Check if OpenAI API key is available
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        console.warn('OpenAI API key not set in environment variables. Using regex extraction only.');
        return {
          firstname,
          lastname,
          email: extractedEmail,
          phone: extractedPhone,
          skills: [],
          experience: [],
          education: [],
          summary: ''
        };
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a specialized resume parser with expertise in extracting contact information, particularly COMPLETE email addresses and FULL international phone numbers.

CRITICAL TASK: Extract the following information from resumes with MAXIMUM precision:
- First name
- Last name
- Email address (MUST be complete and valid format: username@domain.tld)
- Phone number (MUST be complete with country code and all digits)
- Skills (as an array)
- Work experience (company, position, dates, description)
- Education (institution, degree, field, graduation date)
- Professional summary

EMAIL EXTRACTION - CRITICAL REQUIREMENTS:
- Extract the COMPLETE email address with exact username, domain, and TLD
- NEVER truncate or abbreviate any part of the email address
- Check for emails near labels like "Email:", "E-mail:", "Contact:", etc.
- Be aware of obfuscated emails like "name (at) domain (dot) com"
- If multiple email addresses are present, select the most professional one
- Validate that the extracted email follows a proper format
- ALWAYS include the full email address in your response

PHONE NUMBER EXTRACTION - CRITICAL REQUIREMENTS:
- Extract the COMPLETE phone number with ALL digits and proper formatting
- ALWAYS include the country code (e.g., +351 for Portugal, +44 for UK, +1 for US/Canada)
- For international numbers:
  * Portugal: Convert numbers starting with 00351 to +351, or add +351 to 9-digit numbers starting with 9
  * UK: Convert numbers starting with 0 to +44 format (e.g., 07123 456789 → +44 7123 456789)
  * US/Canada: Add +1 to 10-digit numbers
- Look for numbers that follow these patterns:
  * Portugal: +351 XXX XXX XXX or 9XX XXX XXX
  * UK: +44 XXXX XXXXXX or 0XXXX XXXXXX
  * International: +[country code] followed by digits
- Preserve any formatting like spaces or hyphens
- If multiple phone numbers are present, select the most complete one with country code
- NEVER truncate or omit any digits from the phone number
- ALWAYS include the full phone number in your response

FORMAT RESPONSE AS JSON with these fields:
- firstname
- lastname
- email (COMPLETE email address)
- phone (COMPLETE phone number with country code)
- skills (array)
- experience (array of objects with: company, position, startDate, endDate, description)
- education (array of objects with: institution, degree, field, graduationDate)
- summary

ACCURACY IS CRITICAL: If you're not 100% certain about any field, leave it blank rather than guessing.
COMPLETENESS IS MANDATORY: Never truncate or abbreviate email addresses or phone numbers.`
          },
          {
            role: "user",
            content: `Extract structured information from this resume text. Pay special attention to extracting the COMPLETE email address and FULL phone number with country code: 
            
            ${text.substring(0, 8000)}` // Limit text length to avoid token limits
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content || '{}';
      const result = JSON.parse(content);
      
      console.log("AI extracted email:", result.email);
      console.log("AI extracted phone:", result.phone);
      
      // Prioritize regex-extracted email and phone if available
      // For email, use regex-extracted if it looks valid, otherwise use AI-extracted
      let finalEmail = '';
      if (extractedEmail && extractedEmail.includes('@') && extractedEmail.includes('.')) {
        finalEmail = extractedEmail;
      } else if (result.email && result.email.includes('@') && result.email.includes('.')) {
        finalEmail = result.email;
      }
      
      // For phone, normalize both AI and regex extracted numbers
      let aiPhone = result.phone ? normalizePhoneNumber(result.phone) : '';
      let regexPhone = extractedPhone ? extractedPhone : '';
      
      // Choose the best phone number (prefer one with country code)
      let finalPhone = '';
      if (regexPhone && regexPhone.startsWith('+')) {
        finalPhone = regexPhone;
      } else if (aiPhone && aiPhone.startsWith('+')) {
        finalPhone = formatPhoneNumber(aiPhone);
      } else {
        // If neither has a country code, use the one with more digits
        const aiDigits = aiPhone.replace(/\D/g, '').length;
        const regexDigits = regexPhone.replace(/\D/g, '').length;
        
        if (aiDigits >= regexDigits && aiDigits > 0) {
          finalPhone = formatPhoneNumber(aiPhone);
        } else if (regexDigits > 0) {
          finalPhone = regexPhone;
        }
      }
      
      console.log("Final selected email:", finalEmail);
      console.log("Final selected phone:", finalPhone);
      
      // Format the result to match our expected structure
      return {
        firstname: result.firstname || result.firstName || firstname || '',
        lastname: result.lastname || result.lastName || lastname || '',
        email: finalEmail,
        phone: finalPhone,
        skills: result.skills || [],
        experience: result.experience || result.workExperience || [],
        education: result.education || [],
        summary: result.summary || ''
      };
    } catch (aiError) {
      console.error('Error using OpenAI for extraction:', aiError);
      
      // Return basic info extracted via regex if AI fails
      return {
        firstname: firstname || '',
        lastname: lastname || '',
        email: extractedEmail || '',
        phone: extractedPhone || '',
        skills: [],
        experience: [],
        education: [],
        summary: ''
      };
    }
  } catch (error) {
    console.error('Error extracting resume info:', error);
    return {}; // Return empty object instead of throwing to avoid breaking the app
  }
}