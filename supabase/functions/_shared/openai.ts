// OpenAI API wrapper for resume parsing
export async function extractResumeInfo(text: string, apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a specialized resume parser with expertise in extracting contact information, particularly COMPLETE email addresses and FULL international phone numbers.

CRITICAL TASK: Extract the following information from resumes with MAXIMUM precision:
- First name
- Last name
- Email address (MUST be complete and valid format: username@domain.tld)
- Phone number (MUST be complete with country code)
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
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return {};
  }
}