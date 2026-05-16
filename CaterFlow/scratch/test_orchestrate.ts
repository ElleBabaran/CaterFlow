async function testOrchestrate() {
  const response = await fetch("http://localhost:3000/api/ai/orchestrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "Wedding for 50 people, Filipino cuisine" }),
  });
  console.log("Status:", response.status);
  const data = await response.json();
  console.log("Data:", JSON.stringify(data).substring(0, 1000));
}
testOrchestrate();
