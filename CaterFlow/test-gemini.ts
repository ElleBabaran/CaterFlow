import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: "C:\\Users\\Aron\\Desktop\\caterFlow\\CaterFlow\\.env" });

const apiKey = process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.log("NO API KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function test() {
  try {
    console.log("Calling Gemini...");
    const response = await ai.models.generateContent({
      model: "models/gemini-1.5-flash",
      contents: `You are the CaterFlow Senior Concierge. 
      User Input: "I wanna use tagalog"
      Current Question Context: "Hi! I'm your AI Catering Assistant. What type of event are you planning? (e.g. Wedding, Birthday, Corporate)"
      Next Goal: "How many guests are you expecting?"
      Preferred Language: english
      
      Return JSON: {
        "intent": { "type": "ANSWER"|"LANGUAGE_CHANGE"|"GENERAL_REQUEST"|"DONE", "value": "extracted value" },
        "validation": { "valid": boolean, "message": "analytical error message if invalid" },
        "reply": { "reply": "expert analytical response in english" }
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                value: { type: Type.STRING }
              },
              required: ["type"]
            },
            validation: {
              type: Type.OBJECT,
              properties: {
                valid: { type: Type.BOOLEAN },
                message: { type: Type.STRING }
              },
              required: ["valid"]
            },
            reply: {
              type: Type.OBJECT,
              properties: {
                reply: { type: Type.STRING }
              },
              required: ["reply"]
            }
          },
          required: ["intent", "validation", "reply"]
        }
      }
    });
    console.log("Response:", response.text);
  } catch (err) {
    console.error("Caught error:", err);
  }
}

test();
