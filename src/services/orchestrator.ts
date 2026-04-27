export async function predictWeather(location: string, date: string) {
  try {
    const response = await fetch("/api/weather", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, date })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to predict weather");
    }

    return await response.json();
  } catch (error) {
    console.error("Weather prediction error:", error);
    return { summary: "Predictive analysis unavailable via Neural Ops link.", risk_level: "low", recommendations: ["Monitor local reports manually."] };
  }
}

export async function orchestrateCatering(input: string, onStep: (step: any) => void) {
  try {
    const response = await fetch("/api/orchestrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to orchestrate catering");
    }

    const result = await response.json();

    if (result.success) {
      // Replay the steps with short delays to maintain the dashboard "live" feel
      for (const step of result.steps) {
        onStep(step);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate agent communication delay
      }
      return { success: true, data: result.finalData };
    }

    return result;
  } catch (error) {
    console.error("Orchestration error:", error);
    throw error;
  }
}
