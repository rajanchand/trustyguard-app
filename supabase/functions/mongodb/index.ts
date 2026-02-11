import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MONGODB_API_KEY = Deno.env.get("MONGODB_API_KEY");
    const MONGODB_APP_ID = Deno.env.get("MONGODB_APP_ID");
    if (!MONGODB_API_KEY || !MONGODB_APP_ID) {
      throw new Error("MONGODB_API_KEY or MONGODB_APP_ID not configured");
    }

    const DATA_API_URL = `https://data.mongodb-api.com/app/${MONGODB_APP_ID}/endpoint/data/v1`;

    const { action, collection, database, query, data, filter, update, pipeline, options } = await req.json();
    const db = database || "zerotrustsecurity";

    const endpointMap: Record<string, string> = {
      find: "find",
      findOne: "findOne",
      insertOne: "insertOne",
      insertMany: "insertMany",
      updateOne: "updateOne",
      updateMany: "updateMany",
      deleteOne: "deleteOne",
      deleteMany: "deleteMany",
      aggregate: "aggregate",
    };

    const endpoint = endpointMap[action];
    if (!endpoint) throw new Error(`Unknown action: ${action}`);

    const body: Record<string, unknown> = {
      dataSource: "zerotrustsecurity",
      database: db,
      collection,
    };

    switch (action) {
      case "find":
        body.filter = query || {};
        if (options?.limit) body.limit = options.limit;
        if (options?.sort) body.sort = options.sort;
        break;
      case "findOne":
        body.filter = query || {};
        break;
      case "insertOne":
        body.document = data;
        break;
      case "insertMany":
        body.documents = data;
        break;
      case "updateOne":
      case "updateMany":
        body.filter = filter || query || {};
        body.update = update || { "$set": data };
        break;
      case "deleteOne":
      case "deleteMany":
        body.filter = query || filter || {};
        break;
      case "aggregate":
        body.pipeline = pipeline || query || [];
        break;
    }

    const response = await fetch(`${DATA_API_URL}/action/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": MONGODB_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`MongoDB Data API error [${response.status}]: ${JSON.stringify(result)}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("MongoDB error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
