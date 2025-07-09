const { createClient } = require("@supabase/supabase-js");

// --- Whitelist of allowed domains ---
const allowedOrigins = [
  "https://tbilisihc.andrinoff.com",
  "https://tbilisi.hackclub.com",
  "http://localhost:5173", // SvelteKit dev
  "http://localhost:8888", // Netlify dev
];

// --- Initialize Supabase Client ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Server configuration error: Missing Supabase URL or Service Key."
  );
}

const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// --- Netlify Function Handler ---
exports.handler = async function (event, context) {
  const origin = event.headers.origin;
  const corsHeaders = {};

  if (allowedOrigins.includes(origin)) {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
    corsHeaders["Access-Control-Allow-Headers"] = "Content-Type";
  }

  if (event.httpMethod === "OPTIONS") {
    if (allowedOrigins.includes(origin)) {
      return {
        statusCode: 204,
        headers: {
          ...corsHeaders,
          "Access-Control-Allow-Methods": "DELETE, OPTIONS",
        },
        body: "",
      };
    } else {
      return { statusCode: 403, body: "Origin not allowed" };
    }
  }

  if (!allowedOrigins.includes(origin)) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: "Requests from this origin are not permitted.",
      }),
    };
  }

  if (event.httpMethod !== "DELETE") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed` }),
    };
  }

  try {
    const id = event.path.split("/").pop();
    if (!id) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Submission ID is required." }),
      };
    }

    const { error } = await supabaseClient
      .from("submissions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("DATABASE DELETE ERROR:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Database query failed.",
          details: error.message,
        }),
      };
    }

    return {
      statusCode: 204, // No Content
      headers: corsHeaders,
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
