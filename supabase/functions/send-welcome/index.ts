import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get customers without whatsapp communications using the new RPC function
    const { data: customers, error: customersError } = await supabase.rpc(
      "get_customers_without_whatsapp_communications",
      {
        type: "whatsapp",
      }
    );

    if (customersError) throw customersError;

    // Get welcome template
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select("content")
      .eq("name", "welcome")
      .single();

    if (templateError) throw templateError;
    if (!template) throw new Error("Welcome template not found");

    const results = [];
    if (customers.length === 0) {
      throw Error("No customers found");
    }
    console.log(customers.length);

    // Send welcome message to each customer
    for (const customer of customers) {
      if (!customer.phone_validated) continue;

      // Process template variables
      const message = template.content
        .replace("{firstname}", customer.firstname)
        .replace("{lastname}", customer.lastname);

      try {
        const { data, error } = await supabase.functions.invoke(
          "send-whatsapp",
          {
            body: {
              number: customer.phone,
              message: message,
              customerId: customer.id,
            },
          }
        );

        if (error) {
          console.error(
            `Error sending message to customer ${customer.id}:`,
            error
          );
          // Update customer to is_validated = false if there is an error
          await supabase
            .from("customers")
            .update({ phone_validated: false })
            .eq("id", customer.id);

          results.push({
            customerId: customer.id,
            success: false,
            error: error.message || "Unknown error",
          });
          continue; // Skip to the next customer
        }

        if (!data.success) {
          console.error(`Failed to send message to customer ${customer.id}`);
          results.push({
            customerId: customer.id,
            success: false,
            error: data.message || "Failed to send message",
          });
          continue; // Skip to the next customer
        }

        results.push({
          customerId: customer.id,
          success: true,
          communication: data.communication,
        });
      } catch (error) {
        console.error(
          `Error sending welcome message to customer ${customer.id}:`,
          error
        );
        results.push({
          customerId: customer.id,
          success: false,
          error: error.message || "Unexpected error",
        });
      }

      // Add a small delay between messages
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${customers.length} customers`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
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
