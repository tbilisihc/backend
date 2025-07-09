// This function is for authenticating the admin user.
// It checks a provided password against a master password stored in environment variables.

// Using module.exports for maximum compatibility with Netlify's runtime environment.
exports.handler = async function (event, context) {
  // --- Allow only POST requests ---
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // --- Get master password from environment variables ---
  const MASTER_PASSWORD = process.env.MASTER_PASSWORD;

  if (!MASTER_PASSWORD) {
    console.error("MASTER_PASSWORD environment variable not set.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error." }),
    };
  }

  try {
    const { password } = JSON.parse(event.body);

    // --- Compare provided password with master password ---
    if (password === MASTER_PASSWORD) {
      // --- Success ---
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Login successful." }),
      };
    } else {
      // --- Failure ---
      return {
        statusCode: 401, // Unauthorized
        body: JSON.stringify({ error: "Incorrect password." }),
      };
    }
  } catch (error) {
    console.error("Login function error:", error);
    return {
      statusCode: 400, // Bad Request (e.g., malformed JSON)
      body: JSON.stringify({ error: "Invalid request." }),
    };
  }
};
