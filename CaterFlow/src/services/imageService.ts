
import { IMAGE_KEYS, BASE_URL } from "./aiConfig";

export async function generateFoodImage(dishName: string, description: string): Promise<string | null> {
  console.log(`[CaterFlow] Generating AI image for: ${dishName}`);
  
  // Try each key in the pool until one works
  for (const key of IMAGE_KEYS) {
    try {
      const response = await fetch(`${BASE_URL}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `Professional gourmet food photography of ${dishName}. ${description}. Cinematic lighting, 8k resolution, highly detailed, appetizing, plated on a beautiful plate, neutral background.`,
          n: 1,
          size: "1024x1024"
        })
      });

      if (!response.ok) {
        console.warn(`[CaterFlow] Image key failed or quota hit, trying next... Status: ${response.status}`);
        continue;
      }

      const data = await response.json();
      return data.data?.[0]?.url || null;
    } catch (err) {
      console.error("[CaterFlow] Error generating image with key:", err);
      continue;
    }
  }

  console.error("[CaterFlow] All private image generation keys failed. Using ultra-reliable fallback...");
  
  // Final Fallback 1: Pollinations AI (Free, no key required, very high uptime)
  try {
    const prompt = encodeURIComponent(`Professional gourmet food photography of ${dishName}. Cinematic lighting, highly detailed.`);
    return `https://pollinations.ai/p/${prompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
  } catch (e) {
    // Final Fallback 2: High-quality food stock photo
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000`;
  }
}
