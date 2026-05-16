import { GoogleGenAI } from "@google/genai";

const keys = [
  "AIzaSyBb4aySG9lvsoRNxvZM4lHY402zvs0Fviw",
  "AIzaSyCyu4w_vv_QgiJN_acUaD1tCa7zXXUVGaM",
  "AIzaSyBzq-8E39VqplVVjik__RDnk2O0vfMehjI",
  "AIzaSyBdv5jABaDEA1_G8D1jxIYiRBymyXQPSJs"
];

async function testKeys() {
  for (const key of keys) {
    console.log(`Testing key: ${key.slice(0, 8)}...`);
    try {
      const genAI = new GoogleGenAI({ apiKey: key });
      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: [{ role: "user", parts: [{ text: "Say 'OK'" }] }]
      });
      console.log(`Key ${key.slice(0, 8)}: SUCCESS (${response.text?.trim() || "No text"})`);
    } catch (err: any) {
      console.log(`Key ${key.slice(0, 8)}: FAILED - ${err.message}`);
    }
  }
}

testKeys();
