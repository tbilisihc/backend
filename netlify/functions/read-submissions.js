const { createClient } = require("@supabase/supabase-js");

// --- Initialize Supabase Client ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Server configuration error: Missing Supabase URL or Key.");
}

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// --- Netlify Function Handler ---
exports.handler = async function (event, context) {
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
      .select("id, email, phone, name, created_at, accepted")
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
};
