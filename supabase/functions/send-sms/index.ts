import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { phone, orderId, amount, name } = await req.json();

    if (!phone || !orderId) {
      return new Response(
        JSON.stringify({ error: "phone and orderId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const message = `Hi ${name ?? "Customer"}! Your AKSelling order #${orderId.slice(0, 8)} for Rs.${amount} has been confirmed. Track your order in the app. Thank you for shopping with AKSelling!`;

    // Read Twilio credentials from the database (service role bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: config, error: configError } = await supabase
      .from("sms_config")
      .select("account_sid, auth_token, from_number")
      .eq("id", 1)
      .maybeSingle();

    if (configError || !config) {
      console.log("SMS config not found, skipping SMS send:", configError?.message ?? "no row");
      return new Response(
        JSON.stringify({ success: true, message: "Order confirmed (SMS not configured)", orderId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Call Twilio REST API to send the SMS
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.account_sid}/Messages.json`;
    const authString = btoa(`${config.account_sid}:${config.auth_token}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: config.from_number,
        To: `+91${phone}`,
        Body: message,
      }),
    });

    if (!twilioResponse.ok) {
      const errBody = await twilioResponse.text();
      console.error("Twilio API error:", twilioResponse.status, errBody);
      return new Response(
        JSON.stringify({ success: true, message: "Order confirmed (SMS delivery failed)", orderId, sms_error: errBody }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const twilioData = await twilioResponse.json();
    console.log("SMS sent successfully via Twilio:", twilioData.sid);

    return new Response(
      JSON.stringify({ success: true, message: "Order confirmation SMS sent", orderId, twilio_sid: twilioData.sid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
