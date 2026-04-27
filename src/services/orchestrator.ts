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
    return { summary: "Predictive analysis link unstable.", risk_level: "low", recommendations: ["Neural bypass active. Plan for standard conditions."] };
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
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Orchestration failure: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // Simulate steps with a delay to maintain the "agent analysis" feel
      for (const step of result.steps) {
        onStep(step);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      return { success: true, data: result.finalData };
    }

    return result;
  } catch (error) {
    console.error("Orchestration error:", error);
    throw error;
  }
}
