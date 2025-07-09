// --- Whitelist of allowed domains ---
const allowedOrigins = [
  "https://tbilisihc.andrinoff.com",
  "https://tbilisi.hackclub.com",
  "http://localhost:5173", // SvelteKit dev
  "http://localhost:8888", // Netlify dev
];

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
          "Access-Control-Allow-Methods": "POST, OPTIONS",
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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const { MASTER_PASSWORD } = process.env;

  if (!MASTER_PASSWORD) {
    console.error("MASTER_PASSWORD environment variable not set.");
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Server configuration error." }),
    };
  }

  try {
    const { password } = JSON.parse(event.body);

    if (password === MASTER_PASSWORD) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Login successful." }),
      };
    } else {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Incorrect password." }),
      };
    }
  } catch (error) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid request." }),
    };
  }
};
