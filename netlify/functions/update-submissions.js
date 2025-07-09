import { createClient } from "@supabase/supabase-js";

// --- Initialize Supabase Client ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Server configuration error: Missing Supabase URL or Key.");
}

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// --- Define CORS Headers ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "PATCH, OPTIONS",
};

// --- Netlify Function Handler ---
export async function handler(event, context) {
  // --- Handle preflight OPTIONS request ---
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  // --- Ensure the request is a PATCH request ---
  if (event.httpMethod !== "PATCH") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed` }),
    };
  }

  try {
    // --- Get submission ID from the URL ---
    const id = event.path.split("/").pop();
    if (!id) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Submission ID is required." }),
      };
    }

    // --- Parse the request body ---
    const { accepted } = JSON.parse(event.body);

    // --- Validate Input ---
    if (typeof accepted !== "boolean") {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "The 'accepted' field must be a boolean.",
        }),
      };
    }

    // --- Update Data in Database ---
    const { data, error } = await supabaseClient
      .from("submissions")
      .update({ accepted })
      .eq("id", id)
      .select()
      .single();

    // --- Handle Database Errors ---
    if (error) {
      console.error("DATABASE UPDATE ERROR:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Database operation failed.",
          details: error.message,
        }),
      };
    }

    // --- Return Success Response ---
    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    // --- Handle Unexpected Errors ---
    console.error("UNEXPECTED ERROR:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "An unexpected server error occurred.",
        details: err.message,
      }),
    };
  }
}
