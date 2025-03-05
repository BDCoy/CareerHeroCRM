import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import sgMail from "npm:@sendgrid/mail";
import { extractResumeInfo } from "../_shared/openai.ts"; // Resume extraction function

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    return JSON.parse(data.choices[0].message.content);
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

function base64ToText(base64String: string): string {
  // Decode Base64 string into binary
  const binaryString = atob(base64String);

  // Convert binary string into a Uint8Array (byte buffer)
  const byteArray = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    byteArray[i] = binaryString.charCodeAt(i);
  }

  // Decode the Uint8Array into a UTF-8 string
  return new TextDecoder("utf-8").decode(byteArray);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Load environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY"); // OpenAI API Key
    const fromEmail =
      Deno.env.get("SENDGRID_FROM_EMAIL") || "noreply@example.com";
    const fromName = Deno.env.get("SENDGRID_FROM_NAME") || "CRM System";

    if (!supabaseUrl || !supabaseAnonKey || !sendgridApiKey || !openaiApiKey) {
      throw new Error("Missing environment variables");
    }

    // Initialize Supabase & SendGrid
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    sgMail.setApiKey(sendgridApiKey);

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (err) {
      throw new Error("Invalid JSON in request body");
    }

    const { to, subject, body, cc, bcc, attachments } = requestBody;
    let resumeUrl = null;
    let extractedInfo = {};
    let customerId = null;

    // Handle resume attachments
    const resumeAttachments = attachments?.filter((att) =>
      [".pdf", ".doc", ".docx", ".txt"].some((ext) =>
        att.filename.toLowerCase().endsWith(ext)
      )
    );

    if (resumeAttachments?.length > 0) {
      const attachment = resumeAttachments[0]; // Use the first valid resume
      const fileName = `${Date.now()}-${attachment.filename}`;
      const filePath = `resumes/${fileName}`;

      // Extract Base64 data (remove "data:application/pdf;base64," prefix)
      const base64Data = attachment.content.split(",")[1]; // Get only the Base64-encoded part

      // Convert Base64 to Blob
      const fileBlob = base64ToBlob(base64Data, attachment.contentType);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
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
      let resumeText = "";
      if (
        attachment.contentType === "text/plain" ||
        attachment.contentType === "application/pdf"
      ) {
        resumeText = base64ToText(base64Data);
      } else {
        resumeText = body || "";
      }

      // Extract structured information using OpenAI
      extractedInfo = await extractResumeInfo(resumeText, openaiApiKey);
    }

    // Check if customer exists
    const { data: existingCustomer, error: customerError } = await supabase
      .from("customers")
      .select("id, email")
      .eq("email", extractedInfo.email || to)
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
        notes: `Created from email attachment.\nSubject: ${subject}\nBody: ${body.substring(
          0,
          1000
        )}`,
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

    // Send email via SendGrid
    const msg = {
      to,
      from: { email: fromEmail, name: fromName },
      subject,
      html: body.replace(/\n/g, "<br>"),
      ...(cc && { cc }),
      ...(bcc && { bcc }),
      ...(attachments?.length && {
        attachments: attachments.map((att) => ({
          content: att.content.includes(",")
            ? att.content.split(",")[1]
            : att.content,
          filename: att.filename,
          type: att.contentType,
          disposition: "attachment",
        })),
      }),
    };

    await sgMail.send(msg);

    // Log communication in Supabase
    const communication = {
      customerid: customerId,
      type: "email",
      content: `Subject: ${subject}\n\n${body}`,
      sentat: new Date().toISOString(),
      status: "sent",
      metadata: {
        from: fromEmail,
        to,
        cc,
        bcc,
        hasAttachments: attachments?.length > 0,
      },
    };

    const { data: commData, error: commError } = await supabase
      .from("communications")
      .insert([communication])
      .select()
      .single();

    if (commError) throw commError;

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
});
