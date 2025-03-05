import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@example.com';
    const fromName = Deno.env.get('SENDGRID_FROM_NAME') || 'CRM System';

    if (!supabaseUrl || !supabaseAnonKey || !sendgridApiKey) {
      throw new Error('Missing environment variables');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Parse request body
    const { to, subject, body, cc, bcc, customerId, attachments } = await req.json();

    // Validate required fields
    if (!to || !subject || !body) {
      throw new Error('Missing required fields');
    }

    // Check if customer exists by email
    const { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select('id, email')
      .eq('email', to)
      .maybeSingle();

    if (customerError) {
      throw customerError;
    }

    // Use existing customer ID if found, otherwise create new customer
    let finalCustomerId = customerId;

    if (!customerId && !existingCustomer) {
      // Create new customer
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert([{
          firstname: to.split('@')[0].split('.')[0] || 'Unknown',
          lastname: to.split('@')[0].split('.')[1] || 'Customer',
          email: to,
          phone: '',
          status: 'lead',
          source: 'Email',
          notes: `Created from email: ${subject}`
        }])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      finalCustomerId = newCustomer.id;
    } else if (existingCustomer) {
      finalCustomerId = existingCustomer.id;
    }

    // Prepare SendGrid API request
    const payload = {
      personalizations: [
        {
          to: [{ email: to }],
          subject,
          ...(cc && { cc: cc.map(email => ({ email })) }),
          ...(bcc && { bcc: bcc.map(email => ({ email })) }),
        },
      ],
      from: { 
        email: fromEmail,
        name: fromName
      },
      content: [
        {
          type: 'text/html',
          value: body.replace(/\n/g, '<br>')
        }
      ]
    };

    // Add attachments if they exist
    if (attachments && attachments.length > 0) {
      payload.attachments = attachments.map(attachment => ({
        content: attachment.content.split(',')[1] || attachment.content,
        filename: attachment.filename,
        type: attachment.contentType,
        disposition: 'attachment'
      }));
    }

    // Send email via SendGrid API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMessage = `SendGrid API error: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = `SendGrid API error: ${errorData.message || response.statusText}`;
      } catch (e) {
        // If we can't parse the error response, just use the status text
      }
      throw new Error(errorMessage);
    }

    // Create communication record
    const communication = {
      customerid: finalCustomerId,
      type: 'email',
      content: `Subject: ${subject}\n\n${body}`,
      sentat: new Date().toISOString(),
      status: 'sent',
      metadata: {
        from: fromEmail,
        to,
        cc,
        bcc,
        template: null,
        hasAttachments: attachments && attachments.length > 0
      }
    };

    const { data: commData, error: commError } = await supabase
      .from('communications')
      .insert([communication])
      .select()
      .single();

    if (commError) {
      throw commError;
    }

    // Capture SendGrid response for debugging
    const sendgridResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      success: true,
      message: 'Email sent successfully',
      communication: commData,
      sendgridResponse,
      customerCreated: !customerId && !existingCustomer
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});