import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const MONGO_PROXY_URL = Deno.env.get("MONGO_PROXY_URL");
    const MONGO_PROXY_SECRET = Deno.env.get("MONGO_PROXY_SECRET");
    if (!MONGO_PROXY_URL) {
      throw new Error("MONGO_PROXY_URL not configured");
    }

    const body = await req.json();

    const response = await fetch(`${MONGO_PROXY_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(MONGO_PROXY_SECRET ? { "x-proxy-secret": MONGO_PROXY_SECRET } : {}),
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: response.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("MongoDB proxy error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
