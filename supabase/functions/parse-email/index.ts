import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import pdf from "npm:pdf-parse/lib/pdf-parse.js";

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// OpenAI API wrapper for resume parsing
async function extractResumeInfo(text: string, apiKey: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
COMPLETENESS IS MANDATORY: Never truncate or abbreviate email addresses or phone numbers.`,
          },
          {
            role: "user",
            content: `Extract structured information from this resume text. Pay special attention to extracting the COMPLETE email address and FULL phone number with country code: 
            
            ${text.substring(0, 8000)}`, // Limit text length to avoid token limits
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    return result;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return {};
  }
}

function base64ToBlob(base64String: string, contentType: string): Blob {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType });
}

async function extractTextFromPDF(pdfUrl: string) {
  console.log(pdfUrl);
  const response = await fetch(pdfUrl);
  const data = await pdf(await response.arrayBuffer());
  return data.text;
}

async function extractTextFromFile(
  file: Uint8Array,
  contentType: string,
  fileUrl: string
): Promise<string> {
  try {
    if (contentType === "application/pdf") {
      return await extractTextFromPDF(fileUrl);
    } else if (contentType === "text/plain") {
      return new TextDecoder("utf-8").decode(file);
    } else {
      console.warn(`⚠️ Unsupported file type: ${contentType}`);
      return `Unsupported file type: ${contentType}. Please upload a PDF or text file.`;
    }
  } catch (error) {
    console.error("❌ Error extracting text from file:", error);
    return `Failed to extract text from ${contentType} file.`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "POST") {
    try {
      // Parse the multipart form data using multiParser
      const form = await multiParser(req);
      const { from: to, subject, text: body } = form.fields;

      if (!form) {
        return new Response("Invalid request", {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Extract the email content from form.fields.email
      const emailContent = form.fields?.email;

      if (!emailContent) {
        return new Response("No email content found", {
          status: 400,
          headers: corsHeaders,
        });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY"); // OpenAI API Key
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      let resumeUrl = null;
      let extractedInfo = {};
      let customerId = null;

      // Parse the email content to find the attachments in base64
      const attachments: Array<{
        filename: string;
        content: string; // Base64 encoded content
        contentType: string;
      }> = [];

      // Regex to extract attachment details
      const attachmentRegex =
        /Content-Type: ([^;]+); name="([^"]+)"\s+Content-Disposition: attachment; filename="([^"]+)"\s+Content-Transfer-Encoding: base64\s+Content-ID: <([^>]+)>\s+X-Attachment-Id: [^ \r\n]+([\s\S]+?)(?=--|$)/g;

      let match;

      while ((match = attachmentRegex.exec(emailContent)) !== null) {
        const filename = match[2];
        const contentType = match[1];
        const base64Content = match[5].replace(/\n/g, "").trim(); // Clean the base64 string

        // Add the attachment to the array
        attachments.push({
          filename,
          content: base64Content,
          contentType,
        });
      }
      console.log(attachments);
      if (attachments.length === 0) {
        throw Error("No attachments founded");
      }
      const resumeAttachments = attachments?.filter((att) =>
        [".pdf", ".txt"].some((ext) => att.filename.toLowerCase().endsWith(ext))
      );
      console.log(resumeAttachments);
      if (resumeAttachments?.length > 0) {
        const attachment = resumeAttachments[0]; // Use the first valid resume
        const fileName = `${Date.now()}-${attachment.filename}`;
        const filePath = `resumes/${fileName}`;

        // Extract Base64 data (remove "data:application/pdf;base64," prefix)
        const base64Data = attachment.content.includes(",")
          ? attachment.content.split(",")[1] // If it's a Data URI
          : attachment.content;
        // Convert Base64 to Blob

        const binaryString = atob(base64Data);
        const fileBuffer = new Uint8Array(binaryString.length);
        const fileBlob = base64ToBlob(base64Data, attachment.contentType);

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("customer-files")
          .upload(filePath, fileBlob, {
            contentType: attachment.contentType,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get public URL of uploaded file
        const { data: urlData } = supabase.storage
          .from("customer-files")
          .getPublicUrl(filePath);

        resumeUrl = urlData.publicUrl;

        // Extract text for OpenAI processing
        const resumeText = await extractTextFromFile(
          fileBuffer,
          attachment.contentType,
          resumeUrl
        );
        console.log(resumeUrl, resumeText);
        // Extract structured information using OpenAI
        extractedInfo = await extractResumeInfo(resumeText, openaiApiKey);

        if (!extractedInfo || Object.keys(extractedInfo).length === 0) {
          console.error("❌ OpenAI did not return valid resume data.");
          extractedInfo = {};
        }

        console.log("✅ Extracted Resume Data:", extractedInfo);
      }

      // Check if customer exists
      const { data: existingCustomer, error: customerError } = await supabase
        .from("customers")
        .select("id, email")
        .eq("email", extractedInfo?.email || to)
        .maybeSingle();

      if (customerError) throw customerError;

      if (existingCustomer) {
        // Update existing customer with resume data
        const { error: updateError } = await supabase
          .from("customers")
          .update({
            phone: extractedInfo.phone || existingCustomer.phone,
            resumeurl: resumeUrl || existingCustomer.resumeurl,
            resumedata: extractedInfo,
            updatedat: new Date().toISOString(),
          })
          .eq("id", existingCustomer.id);

        if (updateError) throw updateError;

        customerId = existingCustomer.id;
      } else {
        // Create a new customer
        const newCustomerData = {
          firstname:
            extractedInfo.firstname ||
            to.split("@")[0].split(".")[0] ||
            "Unknown",
          lastname:
            extractedInfo.lastname ||
            to.split("@")[0].split(".")[1] ||
            "Customer",
          email: extractedInfo.email || to,
          phone: extractedInfo.phone || "",
          status: "lead",
          source: `Email: ${subject}`,
          notes: `Created from email attachment.\nSubject: ${subject}\nBody: ${body}`,
          resumeurl: resumeUrl,
          resumedata: extractedInfo,
          createdat: new Date().toISOString(),
        };

        const { data: newCustomer, error: createError } = await supabase
          .from("customers")
          .insert([newCustomerData])
          .select()
          .single();

        if (createError) throw createError;

        customerId = newCustomer.id;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: existingCustomer
            ? "Customer updated successfully"
            : "Customer created successfully",
          customerId,
          customerCreated: !existingCustomer,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (error) {
      console.error("Error:", error);
      return new Response(
        JSON.stringify({ success: false, message: error.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
});
