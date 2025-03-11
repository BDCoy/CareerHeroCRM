import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Parse the webhook payload
    const body = await req.json();
    console.log("Incoming webhook data:", body);

    // Extract relevant data from the webhook
    const {
      message,
      bufferImage,
      from,
      name,
      wamsgto,
      walocation_id,
      geolatitude,
      geolongitude,
      message_type,
      from_me,
      msg_type,
      media_link,
      message_id
    } = body;

    // Find the customer based on the phone number
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', from)
      .single();

    if (customerError) {
      console.error('Error finding customer:', customerError);
    }

    // Create the communication record
    const { data: commData, error: commError } = await supabase
      .from('communications')
      .insert([{
        customerid: customer?.id || 'unknown',
        type: 'whatsapp',
        content: message,
        sentat: new Date().toISOString(),
        status: 'received',
        metadata: {
          from,
          to: wamsgto,
          name,
          message_type,
          from_me: from_me === 'Y',
          msg_type,
          media_link,
          message_id,
          walocation_id,
          ...(geolatitude && geolongitude ? {
            location: {
              latitude: geolatitude,
              longitude: geolongitude
            }
          } : {}),
          ...(bufferImage ? { image: bufferImage } : {})
        }
      }])
      .select()
      .single();

    if (commError) {
      throw commError;
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed successfully",
        communication: commData
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error processing webhook:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});