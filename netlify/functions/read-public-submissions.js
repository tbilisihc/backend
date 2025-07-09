const { createClient } = require("@supabase/supabase-js");

// --- Initialize Supabase Client ---
// This function can use the public 'anon' key as it only reads non-sensitive data.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Server configuration error: Missing Supabase URL or Anon Key."
  );
}

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// --- Netlify Function Handler ---
exports.handler = async function (event, context) {
  // --- Allow all origins for this public endpoint ---
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // --- Handle preflight OPTIONS request ---
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
      body: "",
    };
  }

  // --- Ensure the request is a GET request ---
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, Allow: "GET" },
      body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed` }),
    };
  }

  try {
    // --- Fetch only the 'name' and 'accepted' status where accepted is true ---
    const { data, error } = await supabaseClient
      .from("submissions")
      .select("name")
      .eq("accepted", true) // Only fetch accepted submissions
      .order("created_at", { ascending: false });

    // --- Handle Database Errors ---
    if (error) {
      console.error("DATABASE SELECT ERROR:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Database query failed.",
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
    console.error("UNEXPECTED ERROR:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "An unexpected server error occurred." }),
    };
  }
};
