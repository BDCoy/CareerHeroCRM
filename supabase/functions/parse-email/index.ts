import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import pdf from "npm:pdf-parse/lib/pdf-parse.js";
import mammoth from "npm:mammoth";

interface MultiPartFile {
  name: string;
  filename: string;
  contentType: string;
  size: number;
  content: Uint8Array;
}

/**
 * Describes the shape of form.fields returned by multiParser.
 * Each property is optional because the webhook may or may not include it.
 * We also include an index signature so new/unknown fields won't cause errors.
 */
export interface MultiParserFormFields {
  headers?: string;
  sender_ip?: string;
  from?: string;
  text?: string;
  attachments?: string;
  charsets?: string;
  to?: string;
  subject?: string;
  dkim?: string;
  spam_report?: string;
  spam_score?: string;
  "attachment-info"?: string;
  "content-ids"?: string;
  html?: string;
  SPF?: string;
  envelope?: string;
  [key: string]: unknown;
}

interface MultiParserForm {
  fields?: MultiParserFormFields;
  files?: Record<string, MultiPartFile>;
}

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
- phone (COMPLETE phone number with country code but without "+", no spaces example: 573117574197 like this)
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

async function extractTextFromPDF(pdfUrl: string) {
  const response = await fetch(pdfUrl);
  const data = await pdf(await response.arrayBuffer());
  return data.text;
}

async function extractTextFromDocx(docxFile: Uint8Array): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: docxFile });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    return "Failed to extract text from DOCX file.";
  }
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
    } else if (
      contentType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return await extractTextFromDocx(file);
    } else {
      console.warn(`⚠️ Unsupported file type: ${contentType}`);
      return `Unsupported file type: ${contentType}. Please upload a PDF, DOCX, or text file.`;
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
      const rawForm = await multiParser(req);

      const form = rawForm as MultiParserForm;
      console.log(form.fields);
      if (!form) {
        return new Response("Invalid request", {
          status: 400,
          headers: corsHeaders,
        });
      }

      const subject = form.fields?.subject || "";

      const body = form.fields?.text || "";

      const envelopeStr = form.fields?.envelope || "";

      let envelopeObj: { from?: string; to?: string[] } = {};
      try {
        envelopeObj = JSON.parse(envelopeStr);
      } catch (err) {
        console.warn("Could not parse envelope JSON:", err);
      }

      const fromAddress = envelopeObj.from || form.fields?.from || "";
      const toAddress = envelopeObj.to?.[0] || form.fields?.to || "";

      console.log("Subject:", subject);
      console.log("From:", fromAddress);
      console.log("To:", toAddress);
      console.log("Body:", body);

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY"); // OpenAI API Key
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      let resumeUrl: string | null = null;
      let extractedInfo: Record<string, any> = {};
      let customerId = null;

      const attachments: Array<{
        filename: string;
        content: Uint8Array<ArrayBufferLike>;
        contentType: string;
      }> = [];

      if (form.files) {
        for (const [, fileObj] of Object.entries(form.files)) {
          // Each fileObj will contain name, filename, contentType, size, and content (Uint8Array)
          if (fileObj && fileObj.content && fileObj.filename) {
            // Convert the Uint8Array to base64
            attachments.push({
              filename: fileObj.filename,
              contentType: fileObj.contentType,
              content: fileObj.content,
            });
          }
        }
      }

      if (attachments.length === 0) {
        // If you need attachments, you can decide how to handle the error
        throw new Error("No attachments found");
      }

      // Only log filenames and content length to avoid huge logs
      attachments.forEach((att) => {
        console.log(
          "Attachment:",
          att.filename,
          att.contentType,
          att.content.length
        );
      });

      const resumeExtensions = [".pdf", ".docx", ".txt"];
      const resumeAttachments = attachments.filter((att) =>
        resumeExtensions.some((ext) => att.filename.toLowerCase().endsWith(ext))
      );

      if (resumeAttachments.length === 0) {
        // If you need attachments, you can decide how to handle the error
        throw new Error("No supported attachments found");
      }

      // console.log(resumeAttachments);
      if (resumeAttachments?.length > 0) {
        for (const attachment of resumeAttachments) {
          const fileName = `${Date.now()}-${attachment.filename}`;
          const filePath = `resumes/${fileName}`;

          const fileBuffer = attachment.content;

          // Convert the raw Uint8Array into a Blob (Deno-friendly)
          const fileBlob = new Blob([attachment.content], {
            type: attachment.contentType,
          });

          const { error: uploadError } = await supabase.storage
            .from("customer-files")
            .upload(filePath, fileBlob, {
              contentType: attachment.contentType,
              upsert: true,
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("customer-files")
            .getPublicUrl(filePath);

          resumeUrl = urlData.publicUrl;

          if (!resumeUrl) {
            throw Error("Failed to upload file into storage");
          }

          const resumeText = await extractTextFromFile(
            fileBuffer,
            attachment.contentType,
            resumeUrl
          );

          extractedInfo = await extractResumeInfo(resumeText, openaiApiKey);

          if (!extractedInfo || Object.keys(extractedInfo).length === 0) {
            console.error("❌ OpenAI did not return valid resume data.");
            extractedInfo = {};
          }

          console.log("✅ Extracted Resume Data:", extractedInfo);
        }
      }

      // Check if customer exists
      const { data: existingCustomer, error: customerError } = await supabase
        .from("customers")
        .select("id, email")
        .eq("email", extractedInfo?.email || toAddress)
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
            fromAddress.split("@")[0].split(".")[0] ||
            "Unknown",
          lastname:
            extractedInfo.lastname ||
            fromAddress.split("@")[0].split(".")[1] ||
            "Customer",
          email: extractedInfo.email || fromAddress,
          phone: extractedInfo.phone || "",
          status: "lead",
          source: `Email: ${fromAddress}`,
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
