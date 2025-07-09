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
  }

  if (!allowedOrigins.includes(origin)) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: "Requests from this origin are not permitted.",
      }),
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, Allow: "GET" },
      body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed` }),
    };
  }

  try {
    const { data, error } = await supabaseClient
      .from("submissions")
      .select("id, email, phone, name, created_at, accepted")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("DATABASE SELECT ERROR:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Database query failed." }),
      };
    }

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
