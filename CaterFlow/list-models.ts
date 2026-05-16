import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function list() {
  try {
    const models = await ai.models.list();
    console.log("Models:", JSON.stringify(models, null, 2));
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

list();
