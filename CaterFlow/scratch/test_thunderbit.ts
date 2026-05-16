const THUNDERBIT_API_KEY = "tb_b0fb335ad69c8f50754b65ace26306fd";

async function testThunderbit() {
  console.log("Testing Thunderbit API Key...");
  try {
    const response = await fetch("https://openapi.thunderbit.com/openapi/v1/distill", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${THUNDERBIT_API_KEY}`
      },
      body: JSON.stringify({
        url: "https://www.google.com"
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Thunderbit API Success!");
      console.log("Sample Data:", JSON.stringify(data).substring(0, 200));
    } else {
      const error = await response.text();
      console.error("Thunderbit API Failed:", response.status, error);
    }
  } catch (err) {
    console.error("Connection Error:", err);
  }
}

testThunderbit();
