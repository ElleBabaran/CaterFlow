const PEKPIK_BASE_URL = "https://aiapiv2.pekpik.com/v1";
const DEEPSEEK_KEY = "sk-5b3b358a095a41d88b8814520cd9a090";

async function testDeepSeek() {
  console.log("Testing DeepSeek API Key...");
  try {
    const response = await fetch(`${PEKPIK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: "Say 'OK'" }],
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log("DeepSeek Success!", data.choices?.[0]?.message?.content);
    } else {
      const error = await response.text();
      console.error("DeepSeek Failed:", response.status, error);
    }
  } catch (err) {
    console.error("Connection Error:", err);
  }
}

testDeepSeek();
