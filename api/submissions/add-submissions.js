import { createClient } from "@supabase/supabase-js";

// --- Initialize Supabase Client ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Server configuration error: Missing Supabase URL or Key.");
}

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// --- Define CORS Headers ---
// These headers allow requests from any origin.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- Netlify Function Handler ---
export async function handler(event, context) {
  // --- Handle preflight OPTIONS request ---
  // The browser sends this automatically before the actual POST request to check for CORS permissions.
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204, // 204 No Content is standard for preflight responses
      headers: corsHeaders,
      body: "",
    };
  }

  // --- Ensure the request is a POST request ---
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders, // Include CORS headers in error responses
      body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed` }),
    };
  }

  try {
    // --- Parse the request body ---
    const { name, email, phone } = JSON.parse(event.body);

    // --- Validate Input ---
    if (!name || !email) {
      return {
        statusCode: 400,
        headers: corsHeaders, // Include CORS headers
        body: JSON.stringify({
          error: "The 'name' and 'email' fields are required.",
        }),
      };
    }

    // --- Insert Data into Database ---
    const { data, error } = await supabaseClient
      .from("submissions")
      .insert({ name, phone, email })
      .select()
      .single();

    // --- Handle Database Errors ---
    if (error) {
      console.error("DATABASE INSERT ERROR:", error);
      return {
        statusCode: 500,
        headers: corsHeaders, // Include CORS headers
        body: JSON.stringify({
          error: "Database operation failed.",
          details: error.message,
          hint: error.hint,
        }),
      };
    }

    // --- Return Success Response ---
    return {
      statusCode: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" }, // Combine CORS and content-type headers
      body: JSON.stringify(data),
    };
  } catch (err) {
    // --- Handle Unexpected Errors ---
    console.error("UNEXPECTED ERROR:", err);
    return {
      statusCode: 500,
      headers: corsHeaders, // Include CORS headers
      body: JSON.stringify({
        error: "An unexpected server error occurred.",
        details: err.message,
      }),
    };
  }
}
