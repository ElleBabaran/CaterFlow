const dotenv = require('dotenv');
dotenv.config();

const endpoint = process.env.AZURE_AI_SEARCH_ENDPOINT;
const apiKey = process.env.AZURE_AI_SEARCH_KEY;

if (!endpoint || !apiKey) {
  console.error("Missing credentials");
  process.exit(1);
}

async function testAzureSearch() {
  const indexes = ["caterflow-index", "menus", "suppliers"];
  
  for (const index of indexes) {
    const searchUrl = `${endpoint.replace(/\/$/, "")}/indexes/${index}/docs/search?api-version=2024-07-01`;
    console.log(`Testing Azure AI Search index: ${index}...`);
    
    try {
      const response = await fetch(searchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          search: "*",
          top: 1,
        }),
      });

      if (!response.ok) {
        console.error(`Status: ${response.status} for index ${index}`);
        continue;
      }

      const data = await response.json();
      console.log(`Success! Index ${index} is available.`);
      return; // Stop on first success
    } catch (err) {
      console.error(`Error with index ${index}:`, err.message);
    }
  }
  
  console.log("None of the tested indexes were available. The RAG pipeline will use local fallback data.");
}

testAzureSearch();
