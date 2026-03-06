export async function GET(request) {
  try {
    const accountId = "ACC36d8cf484f1442908d76e394a410a296";

    // List all companies under the account
    const response = await fetch(`https://api.callrail.com/v3/a/${accountId}/companies.json?per_page=100`, {
      headers: {
        Authorization: `Token token=${process.env.CALLRAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const body = await response.json();

    return Response.json({
      status: response.status,
      companies: body,
    });
  } catch (err) {
    return Response.json({ error: err.message });
  }
}
