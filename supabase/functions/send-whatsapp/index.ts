// Follow this setup guide to integrate the Deno runtime:
// https://deno.land/manual/getting_started/setup_your_environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { number, message, customerId } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const whatsappApiKey = Deno.env.get("WHATSAPP_API_KEY");
    const whatsappSender = Deno.env.get("WHATSAPP_SENDER");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    if (!whatsappApiKey || !whatsappSender) {
      throw new Error("Missing WhatsApp environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const payload = JSON.stringify({
      api_key: whatsappApiKey,
      sender: whatsappSender,
      number: number.replace(/\D/g, ""),
      message: message,
    });
    // Send WhatsApp message
    const response = await fetch("https://custom1.waghl.com/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    });

    const data = await response.json();

    console.log(data);

    if (!data.status) {
      throw new Error(data.msg || "Failed to send WhatsApp message");
    }

    // Create communication record
    const { data: commData, error: commError } = await supabase
      .from("communications")
      .insert([
        {
          customerid: customerId,
          type: "whatsapp",
          content: message,
          sentat: new Date().toISOString(),
          status: "sent",
          metadata: {
            from: whatsappSender,
            to: number,
          },
        },
      ])
      .select()
      .single();

    if (commError) {
      throw commError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "WhatsApp message sent successfully",
        communication: commData,
        whatsappResponse: data,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
