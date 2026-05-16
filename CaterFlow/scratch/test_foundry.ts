import dotenv from "dotenv";
dotenv.config();

async function testFoundry() {
  const endpoint = process.env.FOUNDRY_PROJECT_ENDPOINT || "";
  const deployment = process.env.FOUNDRY_MODEL || "";
  const apiKey = process.env.FOUNDRY_API || "";

  console.log("Testing Azure Foundry...");
  console.log("Endpoint:", endpoint);
  console.log("Deployment:", deployment);
  console.log("Key (start):", apiKey.substring(0, 5));

  if (!endpoint || !deployment || !apiKey) {
    console.error("Foundry config missing in .env");
    return;
  }

  const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=2024-10-21`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Say 'OK'" }],
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Foundry Success!", data.choices?.[0]?.message?.content);
    } else {
      const error = await response.text();
      console.error("Foundry Failed:", response.status, error);
    }
  } catch (err) {
    console.error("Connection Error:", err);
  }
}

testFoundry();
