import { createClient } from "@supabase/supabase-js";

// --- Initialize Supabase Client ---
// This is done outside the handler to be reused across warm function invocations.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Ensure Supabase credentials are provided
if (!supabaseUrl || !supabaseAnonKey) {
  // This will cause the function to fail on startup if variables are missing
  throw new Error("Server configuration error: Missing Supabase URL or Key.");
}

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// --- Netlify Function Handler ---
// Note the handler signature returns a response object directly.
export async function handler(event, context) {
  // --- Ensure the request is a GET request ---
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { Allow: "GET" },
      body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed` }),
    };
  }

  try {
    // --- Fetch data from the 'submissions' table ---
    const { data, error } = await supabaseClient
      .from("submissions")
      .select("email, phone, name")
      .order("created_at", { ascending: false });

    // --- Handle Database Errors ---
    if (error) {
      console.error("DATABASE SELECT ERROR:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Database query failed.",
          details: error.message,
        }),
      };
    }

    // --- Return Success Response ---
    // The body must be a string, so we use JSON.stringify.
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("UNEXPECTED ERROR:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "An unexpected server error occurred." }),
    };
  }
}
