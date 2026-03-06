export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id") || "616721950";

    // Test 1: Basic auth check
    const test1 = await fetch(`https://api.callrail.com/v3/a/${companyId}/calls.json?per_page=1`, {
      headers: {
        Authorization: `Token token=${process.env.CALLRAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const test1Body = await test1.json();

    // Test 2: Try account-level (no company)
    const test2 = await fetch(`https://api.callrail.com/v3/a.json`, {
      headers: {
        Authorization: `Token token=${process.env.CALLRAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const test2Body = await test2.json();

    return Response.json({
      api_key_present: !!process.env.CALLRAIL_API_KEY,
      api_key_prefix: process.env.CALLRAIL_API_KEY?.substring(0, 6),
      company_id_tested: companyId,
      test1_status: test1.status,
      test1_response: test1Body,
      test2_status: test2.status,
      test2_response: test2Body,
    });
  } catch (err) {
    return Response.json({ error: err.message });
  }
}
