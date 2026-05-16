import dotenv from 'dotenv';
dotenv.config();

async function testAzure() {
  const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || process.env.FOUNDRY_PROJECT_ENDPOINT || "").trim().replace(/^"|"$/g, '');
  const deployment = (process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.FOUNDRY_MODEL || "").trim().replace(/^"|"$/g, '');
  const apiKey = (process.env.AZURE_OPENAI_API_KEY || process.env.FOUNDRY_API_KEY || process.env.FOUNDRY_API || "").trim().replace(/^"|"$/g, '');

  console.log("Testing Azure AI...");
  console.log("Endpoint:", endpoint);
  console.log("Deployment:", deployment);
  console.log("API Key:", apiKey.substring(0, 5) + "...");

  const urls = [
    `${endpoint.replace(/\/$/, "")}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=2024-10-21`,
    `${endpoint.replace(/\/$/, "")}/chat/completions?api-version=2024-05-01-preview`
  ];

  for (const url of urls) {
    console.log("\nTrying URL:", url);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "api-key": apiKey,
          "Authorization": `Bearer ${apiKey}` // Try both headers
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 5
        }),
      });

      console.log("Status:", response.status);
      const data = await response.json();
      console.log("Response:", JSON.stringify(data).substring(0, 200));
      if (response.ok) {
        console.log("SUCCESS with this URL!");
        return;
      }
    } catch (err: any) {
      console.log("Error:", err.message);
    }
  }
}

testAzure();
