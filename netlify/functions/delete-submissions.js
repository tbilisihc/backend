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
  "Access-Control-Allow-Methods": "DELETE, OPTIONS",
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
  // --- Ensure the request is a DELETE request ---
  if (event.httpMethod !== "DELETE") {
    return {
      statusCode: 405,
      headers: { Allow: "DELETE" },
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

    // --- Delete Data from Database ---
    const { error } = await supabaseClient
      .from("submissions")
      .delete()
      .eq("id", id);

    // --- Handle Database Errors ---
    if (error) {
      console.error("DATABASE DELETE ERROR:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Database query failed.",
          details: error.message,
        }),
      };
    }

    // --- Return Success Response ---
    return {
      statusCode: 204, // No Content
    };
  } catch (err) {
    console.error("UNEXPECTED ERROR:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "An unexpected server error occurred." }),
    };
  }
}
