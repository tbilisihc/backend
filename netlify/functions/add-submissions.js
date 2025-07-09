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
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Server configuration error: Missing Supabase URL or Key.");
}

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// --- Netlify Function Handler ---
exports.handler = async function (event, context) {
  const origin = event.headers.origin;
  const corsHeaders = {};

  if (allowedOrigins.includes(origin)) {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
    corsHeaders["Access-Control-Allow-Headers"] = "Content-Type";
  }

  // --- Handle preflight OPTIONS request ---
  if (event.httpMethod === "OPTIONS") {
    if (allowedOrigins.includes(origin)) {
      return {
        statusCode: 204,
        headers: {
          ...corsHeaders,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
        body: "",
      };
    } else {
      return { statusCode: 403, body: "Origin not allowed" };
    }
  }

  // --- Block requests from non-allowed origins ---
  if (!allowedOrigins.includes(origin)) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: "Requests from this origin are not permitted.",
      }),
    };
  }

  // --- Ensure the request is a POST request ---
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed` }),
    };
  }

  try {
    const { name, email, phone } = JSON.parse(event.body);

    if (!name || !email) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "The 'name' and 'email' fields are required.",
        }),
      };
    }

    const { data, error } = await supabaseClient
      .from("submissions")
      .insert({ name, phone, email })
      .select()
      .single();

    if (error) {
      console.error("DATABASE INSERT ERROR:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Database operation failed.",
          details: error.message,
        }),
      };
    }

    return {
      statusCode: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
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
};
