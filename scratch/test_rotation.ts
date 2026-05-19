
// Using native fetch

async function testRotation() {
  const url = 'http://localhost:3000/api/ai/orchestrate';
  const payload = {
    prompt: "I want a high-end wedding catering for 50 guests in Makati. Cuisine: Modern Filipino. Style: Fine Dining. Dietary: No seafood."
  };

  console.log("Starting Rotation Test...");

  for (let i = 1; i <= 5; i++) {
    console.log(`\n--- Attempt ${i} ---`);
    try {
      const start = Date.now();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const duration = Date.now() - start;

      if (res.ok) {
        console.log(`✅ Success (${duration}ms)`);
        console.log(`Provider: ${data.provider}`);
        if (data.data && data.data.menu) {
          console.log(`Menu Items: ${data.data.menu.menu.length}`);
          console.log(`First Dish: ${data.data.menu.menu[0].dish}`);
        }
      } else {
        console.error(`❌ Failed (${duration}ms): ${data.error}`);
      }
    } catch (err) {
      console.error(`💥 Error: ${err.message}`);
    }
  }
}

testRotation();
