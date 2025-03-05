import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { extractResumeInfo } from '../_shared/openai.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !openaiApiKey) {
      throw new Error('Missing environment variables');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Parse the webhook payload
    const payload = await req.json();
    const { from, to, subject, text, html, attachments = [] } = payload;

    console.log('Received email:', { from, to, subject });

    // Check if customer already exists by email
    const { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select('id, email')
      .eq('email', from)
      .maybeSingle();

    if (customerError) {
      throw customerError;
    }

    // Process attachments if they exist
    const resumeAttachments = attachments.filter(attachment => {
      const filename = attachment.filename.toLowerCase();
      return filename.endsWith('.pdf') || 
             filename.endsWith('.doc') || 
             filename.endsWith('.docx') || 
             filename.endsWith('.txt');
    });

    if (resumeAttachments.length === 0) {
      // If no resume attachments, just create communication record for existing customer
      if (existingCustomer) {
        const communication = {
          customerid: existingCustomer.id,
          type: 'email',
          content: `Subject: ${subject}\n\n${text || html}`,
          sentat: new Date().toISOString(),
          status: 'received',
          metadata: {
            from,
            to,
            hasAttachments: false,
            isRead: false
          }
        };

        const { error: commError } = await supabase
          .from('communications')
          .insert([communication]);

        if (commError) {
          console.error('Error creating communication:', commError);
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Email received and communication created',
          customerId: existingCustomer.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }

      console.log('No resume attachments found');
      return new Response(JSON.stringify({
        success: false,
        message: 'No resume attachments found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Process the first resume attachment
    const attachment = resumeAttachments[0];
    
    // Upload the attachment to Supabase storage
    const fileExt = attachment.filename.split('.').pop() || 'pdf';
    const fileName = `${Date.now()}-${attachment.filename}`;
    const filePath = `resumes/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('customer-files')
      .upload(filePath, Buffer.from(attachment.content, 'base64'), {
        contentType: attachment.contentType,
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('customer-files')
      .getPublicUrl(filePath);

    const resumeUrl = urlData.publicUrl;

    // Extract text from attachment
    let extractedText = '';
    if (attachment.contentType === 'text/plain') {
      extractedText = Buffer.from(attachment.content, 'base64').toString('utf-8');
    } else {
      // For other file types, use the email body as fallback
      extractedText = text || html || '';
    }

    // Extract information using OpenAI
    const extractedInfo = await extractResumeInfo(extractedText, openaiApiKey);

    // Create resume data object
    const resumeData = {
      skills: extractedInfo.skills || [],
      experience: extractedInfo.experience || [],
      education: extractedInfo.education || [],
      summary: extractedInfo.summary || ''
    };

    let customerId: string;

    if (existingCustomer) {
      // Update existing customer with resume data
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          resumeurl: resumeUrl,
          resumedata: resumeData,
          updatedat: new Date().toISOString()
        })
        .eq('id', existingCustomer.id);

      if (updateError) {
        throw updateError;
      }

      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const customer = {
        firstname: extractedInfo.firstname || from.split('@')[0].split('.')[0] || 'Unknown',
        lastname: extractedInfo.lastname || from.split('@')[0].split('.')[1] || 'Customer',
        email: extractedInfo.email || from,
        phone: extractedInfo.phone || '',
        status: 'lead',
        source: `Email: ${subject}`,
        notes: `Automatically created from email attachment.\nEmail subject: ${subject}\nEmail body: ${text || html}`.substring(0, 1000),
        resumeurl: resumeUrl,
        resumedata: resumeData
      };

      const { data: customerData, error: createError } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      customerId = customerData.id;
    }

    // Create communication record
    const communication = {
      customerid: customerId,
      type: 'email',
      content: `Subject: ${subject}\n\n${text || html}`,
      sentat: new Date().toISOString(),
      status: 'received',
      metadata: {
        from,
        to,
        hasAttachments: true,
        isRead: false
      }
    };

    const { error: commError } = await supabase
      .from('communications')
      .insert([communication]);

    if (commError) {
      console.error('Error creating communication:', commError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: existingCustomer ? 'Customer updated successfully' : 'Customer created successfully',
      customerId,
      customerCreated: !existingCustomer
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});